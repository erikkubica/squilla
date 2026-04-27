package coreapi

import (
	"context"
	"fmt"

	"github.com/d5/tengo/v2"
)

// This file owns the core/menus Tengo module + the recursive
// menu-tree converters. Pulled out because the resolver chain
// (Tengo→MenuItem→resolved-by-slug→Tengo for child recursion)
// is hard to follow alongside other module builders, and the
// menu-tree mappers are themselves four separate functions.

func menusModule(api CoreAPI, ctx context.Context) map[string]tengo.Object {
	return map[string]tengo.Object{
		"get": &tengo.UserFunction{Name: "get", Value: func(args ...tengo.Object) (tengo.Object, error) {
			if len(args) < 1 {
				return wrapError(fmt.Errorf("menus.get: requires slug argument")), nil
			}
			slug := tengoToString(args[0])
			menu, err := api.GetMenu(ctx, slug)
			if err != nil {
				return wrapError(err), nil
			}
			return menuToTengoObj(menu), nil
		}},
		"list": &tengo.UserFunction{Name: "list", Value: func(args ...tengo.Object) (tengo.Object, error) {
			list, err := api.GetMenus(ctx)
			if err != nil {
				return wrapError(err), nil
			}
			results := make([]tengo.Object, len(list))
			for i, m := range list {
				results[i] = menuToTengoObj(m)
			}
			return &tengo.ImmutableArray{Value: results}, nil
		}},
		// upsert({ slug, name, items: [ { label, url | page, target, children: [...] } ] })
		// Creates the menu if missing, replaces all items with the given tree.
		// Item forms:
		//   { label, url }            — custom link, URL is authoritative
		//   { label, page: "<slug>" } — link to a node; URL derived at render
		//                                time from the node's current full_url
		//                                (editors renaming the page don't break
		//                                the menu)
		// Idempotent — call from theme seeds.
		"upsert": &tengo.UserFunction{Name: "upsert", Value: func(args ...tengo.Object) (tengo.Object, error) {
			if len(args) < 1 {
				return wrapError(fmt.Errorf("menus.upsert: requires input map")), nil
			}
			m := getTengoMap(args[0])
			if m == nil {
				return wrapError(fmt.Errorf("menus.upsert: input must be a map")), nil
			}
			items, err := menuItemsFromTengoResolvingNodes(ctx, api, m["items"])
			if err != nil {
				return wrapError(err), nil
			}
			input := MenuInput{
				Name:  tengoToString(m["name"]),
				Slug:  tengoToString(m["slug"]),
				Items: items,
			}
			res, err := api.UpsertMenu(ctx, input)
			if err != nil {
				return wrapError(err), nil
			}
			return menuToTengoObj(res), nil
		}},
	}
}

// menuItemsFromTengoResolvingNodes walks a Tengo menu-items tree and resolves
// any { page: "<slug>" } or { node: "<slug>" } fields into a NodeID lookup so
// the rendered menu picks up the current full_url if the node is renamed.
// An item with an unresolvable page slug is dropped with a log warning rather
// than poisoning the whole seed.
func menuItemsFromTengoResolvingNodes(ctx context.Context, api CoreAPI, obj tengo.Object) ([]MenuItem, error) {
	raw := menuItemsFromTengo(obj)
	out := make([]MenuItem, 0, len(raw))
	for _, it := range raw {
		if it.ItemType == "node" && it.NodeID == nil && it.URL != "" {
			// URL holds the page slug when Tengo used { page: "<slug>" } form.
			list, err := api.QueryNodes(ctx, NodeQuery{Slug: it.URL, Limit: 1})
			if err != nil || list == nil || len(list.Nodes) == 0 {
				// Slug didn't resolve — keep as custom with /<slug> URL so the
				// site still links somewhere plausible.
				it.ItemType = "custom"
				it.URL = "/" + it.URL
			} else {
				id := list.Nodes[0].ID
				it.NodeID = &id
				it.URL = list.Nodes[0].FullURL
			}
		}
		if len(it.Children) > 0 {
			childObj := rewrapForRecursion(it.Children)
			resolved, err := menuItemsFromTengoResolvingNodes(ctx, api, childObj)
			if err != nil {
				return nil, err
			}
			it.Children = resolved
		}
		out = append(out, it)
	}
	return out, nil
}

// rewrapForRecursion converts already-extracted MenuItems back into a
// Tengo-shaped array so the recursion helper can process children uniformly.
// Cheaper than duplicating the resolver logic.
func rewrapForRecursion(items []MenuItem) tengo.Object {
	arr := &tengo.Array{Value: make([]tengo.Object, 0, len(items))}
	for _, it := range items {
		m := map[string]tengo.Object{
			"label":  &tengo.String{Value: it.Label},
			"url":    &tengo.String{Value: it.URL},
			"target": &tengo.String{Value: it.Target},
		}
		if it.ItemType != "" {
			m["item_type"] = &tengo.String{Value: it.ItemType}
		}
		if len(it.Children) > 0 {
			m["children"] = rewrapForRecursion(it.Children)
		}
		arr.Value = append(arr.Value, &tengo.Map{Value: m})
	}
	return arr
}

// menuItemsFromTengo converts a Tengo array of maps into MenuItem structs.
// Each map supports: label (or title), url, page, node, target, children.
// When "page" or "node" is given, we mark ItemType="node" and stash the slug
// in URL as a placeholder — the caller (menuItemsFromTengoResolvingNodes)
// resolves that slug into a NodeID + full_url.
func menuItemsFromTengo(obj tengo.Object) []MenuItem {
	arr, ok := obj.(*tengo.Array)
	if !ok {
		if imm, ok := obj.(*tengo.ImmutableArray); ok {
			out := make([]MenuItem, 0, len(imm.Value))
			for _, v := range imm.Value {
				out = append(out, menuItemFromTengo(v))
			}
			return out
		}
		return nil
	}
	out := make([]MenuItem, 0, len(arr.Value))
	for _, v := range arr.Value {
		out = append(out, menuItemFromTengo(v))
	}
	return out
}

func menuItemFromTengo(v tengo.Object) MenuItem {
	m := getTengoMap(v)
	if m == nil {
		return MenuItem{}
	}
	label := tengoToString(m["label"])
	if label == "" {
		label = tengoToString(m["title"])
	}
	item := MenuItem{
		Label:    label,
		URL:      tengoToString(m["url"]),
		Target:   tengoToString(m["target"]),
		ItemType: tengoToString(m["item_type"]),
	}
	// page/node keys accept a slug; resolver translates to NodeID.
	if slug := tengoToString(m["page"]); slug != "" {
		item.ItemType = "node"
		item.URL = slug
	} else if slug := tengoToString(m["node"]); slug != "" {
		item.ItemType = "node"
		item.URL = slug
	}
	item.Children = menuItemsFromTengo(m["children"])
	return item
}

// menuToTengoObj converts a CoreAPI Menu to a Tengo ImmutableMap.
func menuToTengoObj(menu *Menu) tengo.Object {
	if menu == nil {
		return tengo.UndefinedValue
	}
	m := map[string]tengo.Object{
		"id":   &tengo.Int{Value: int64(menu.ID)},
		"slug": &tengo.String{Value: menu.Slug},
		"name": &tengo.String{Value: menu.Name},
	}
	m["items"] = menuItemsToTengoObj(menu.Items)
	return &tengo.ImmutableMap{Value: m}
}

// menuItemsToTengoObj converts CoreAPI MenuItems to a Tengo array.
func menuItemsToTengoObj(items []MenuItem) tengo.Object {
	arr := make([]tengo.Object, len(items))
	for i, item := range items {
		im := map[string]tengo.Object{
			"id":       &tengo.Int{Value: int64(item.ID)},
			"label":    &tengo.String{Value: item.Label},
			"url":      &tengo.String{Value: item.URL},
			"target":   &tengo.String{Value: item.Target},
			"position": &tengo.Int{Value: int64(item.Position)},
			"children": menuItemsToTengoObj(item.Children),
		}
		if item.ParentID != nil {
			im["parent_id"] = &tengo.Int{Value: int64(*item.ParentID)}
		} else {
			im["parent_id"] = tengo.UndefinedValue
		}
		arr[i] = &tengo.ImmutableMap{Value: im}
	}
	return &tengo.ImmutableArray{Value: arr}
}
