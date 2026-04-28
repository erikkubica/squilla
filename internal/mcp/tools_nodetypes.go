package mcp

import (
	"context"
	"encoding/json"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/coreapi"
)

func (s *Server) registerNodeTypeTools() {
	api := s.deps.CoreAPI

	s.addTool(mcp.NewTool("core.nodetype.list",
		mcp.WithDescription("List all registered node types (post types). Each includes slug, label, icon, description, taxonomies, field_schema, and url_prefixes."),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.ListNodeTypes(ctx)
	})

	s.addTool(mcp.NewTool("core.nodetype.get",
		mcp.WithDescription("Get one node type by slug."),
		mcp.WithString("slug", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.GetNodeType(ctx, stringArg(args, "slug"))
	})

	s.addTool(mcp.NewTool("core.nodetype.create",
		mcp.WithDescription("Register a new node TYPE (the schema — like 'Product', 'Trip'). This is a definition, not an instance.\n\nUse when: the user wants a new kind of content (e.g. 'add a Recipe post type').\nDO NOT use when: creating a page/post/trip — use core.node.create. Adding a tag vocabulary — use core.taxonomy.create.\n\nfield_schema is an array of {name,label,type,required,options?}. select/radio/checkbox options MUST be plain strings, not {label,value} objects (client renders them as React children and crashes on objects)."),
		mcp.WithString("slug", mcp.Required()),
		mcp.WithString("label", mcp.Required(), mcp.Description("Singular label, e.g. 'Product'")),
		mcp.WithString("label_plural", mcp.Description("Plural label used in admin menus and list headings, e.g. 'Products'. Falls back to label when blank.")),
		mcp.WithString("icon", mcp.DefaultString("file-text")),
		mcp.WithString("description"),
		mcp.WithObject("field_schema"),
		mcp.WithObject("url_prefixes"),
		mcp.WithObject("taxonomies"),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		input := nodeTypeInputFromArgs(args)
		return api.RegisterNodeType(ctx, input)
	})

	s.addTool(mcp.NewTool("core.nodetype.update",
		mcp.WithDescription("Update a node type by slug. Changes to field_schema only affect new/edited nodes; existing data is preserved as-is."),
		mcp.WithString("slug", mcp.Required()),
		mcp.WithString("label"),
		mcp.WithString("label_plural"),
		mcp.WithString("icon"),
		mcp.WithString("description"),
		mcp.WithObject("field_schema"),
		mcp.WithObject("url_prefixes"),
		mcp.WithObject("taxonomies"),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		return api.UpdateNodeType(ctx, stringArg(args, "slug"), nodeTypeInputFromArgs(args))
	})

	s.addTool(mcp.NewTool("core.nodetype.delete",
		mcp.WithDescription("Delete a node type by slug. Existing nodes of this type become 'dormant' (hidden but preserved). Recreating the type resurrects them."),
		mcp.WithString("slug", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.DeleteNodeType(ctx, stringArg(args, "slug"))
		return map[string]any{"ok": err == nil}, err
	})
}

func nodeTypeInputFromArgs(args map[string]any) coreapi.NodeTypeInput {
	input := coreapi.NodeTypeInput{
		Slug:        stringArg(args, "slug"),
		Label:       stringArg(args, "label"),
		LabelPlural: stringArg(args, "label_plural"),
		Icon:        stringArg(args, "icon"),
		Description: stringArg(args, "description"),
	}
	if raw, ok := args["field_schema"]; ok {
		b, _ := json.Marshal(raw)
		var fs []coreapi.NodeTypeField
		_ = json.Unmarshal(b, &fs)
		input.FieldSchema = fs
	}
	if raw, ok := args["url_prefixes"]; ok {
		b, _ := json.Marshal(raw)
		var up map[string]string
		_ = json.Unmarshal(b, &up)
		input.URLPrefixes = up
	}
	if raw, ok := args["taxonomies"]; ok {
		b, _ := json.Marshal(raw)
		var tx []coreapi.TaxonomyDefinition
		_ = json.Unmarshal(b, &tx)
		input.Taxonomies = tx
	}
	return input
}
