package mcp

import (
	"context"
	"encoding/json"

	"github.com/mark3labs/mcp-go/mcp"

	"squilla/internal/coreapi"
)

func (s *Server) registerTaxonomyTools() {
	api := s.deps.CoreAPI

	// Taxonomy definitions.
	s.addTool(mcp.NewTool("core.taxonomy.list",
		mcp.WithDescription("List all registered taxonomy definitions (categories, tags, etc.)"),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.ListTaxonomies(ctx)
	})

	s.addTool(mcp.NewTool("core.taxonomy.get",
		mcp.WithDescription("Get a taxonomy definition by slug."),
		mcp.WithString("slug", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.GetTaxonomy(ctx, stringArg(args, "slug"))
	})

	s.addTool(mcp.NewTool("core.taxonomy.create",
		mcp.WithDescription("Register a new taxonomy. node_types lists which node type slugs this taxonomy applies to. `fields` declares per-term metadata fields."),
		mcp.WithString("slug", mcp.Required()),
		mcp.WithString("label", mcp.Required(), mcp.Description("Singular label, e.g. 'Tag'")),
		mcp.WithString("label_plural", mcp.Description("Plural label used in admin list headings, e.g. 'Tags'. Falls back to label when blank.")),
		mcp.WithString("description"),
		mcp.WithBoolean("hierarchical"),
		mcp.WithArray("node_types"),
		mcp.WithArray("fields", mcp.Description("Per-term metadata fields. Same shape as node-type fields: {name, title, type, ...}.")),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		return api.RegisterTaxonomy(ctx, taxonomyInputFromArgs(args))
	})

	s.addTool(mcp.NewTool("core.taxonomy.update",
		mcp.WithDescription("Update a taxonomy definition"),
		mcp.WithString("slug", mcp.Required()),
		mcp.WithString("label"),
		mcp.WithString("label_plural"),
		mcp.WithString("description"),
		mcp.WithBoolean("hierarchical"),
		mcp.WithArray("node_types"),
		mcp.WithArray("fields"),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		return api.UpdateTaxonomy(ctx, stringArg(args, "slug"), taxonomyInputFromArgs(args))
	})

	s.addTool(mcp.NewTool("core.taxonomy.delete",
		mcp.WithDescription("Delete a taxonomy by slug."),
		mcp.WithString("slug", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.DeleteTaxonomy(ctx, stringArg(args, "slug"))
		return map[string]any{"ok": err == nil}, err
	})

	// Taxonomy terms.
	s.addTool(mcp.NewTool("core.term.list",
		mcp.WithDescription("List terms in a taxonomy for a given node type. E.g. list all categories for blog_post."),
		mcp.WithString("node_type", mcp.Required()),
		mcp.WithString("taxonomy", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.ListTerms(ctx, stringArg(args, "node_type"), stringArg(args, "taxonomy"))
	})

	s.addTool(mcp.NewTool("core.term.get",
		mcp.WithDescription("Get a single term by ID."),
		mcp.WithNumber("id", mcp.Required()),
	), "read", func(ctx context.Context, args map[string]any) (any, error) {
		return api.GetTerm(ctx, uintArg(args, "id"))
	})

	s.addTool(mcp.NewTool("core.term.create",
		mcp.WithDescription("Create a new term in a taxonomy."),
		mcp.WithString("node_type", mcp.Required()),
		mcp.WithString("taxonomy", mcp.Required()),
		mcp.WithString("slug", mcp.Required()),
		mcp.WithString("name", mcp.Required()),
		mcp.WithString("description"),
		mcp.WithNumber("parent_id"),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		term := &coreapi.TaxonomyTerm{
			NodeType:    stringArg(args, "node_type"),
			Taxonomy:    stringArg(args, "taxonomy"),
			Slug:        stringArg(args, "slug"),
			Name:        stringArg(args, "name"),
			Description: stringArg(args, "description"),
		}
		if pid := uintArg(args, "parent_id"); pid > 0 {
			term.ParentID = &pid
		}
		return api.CreateTerm(ctx, term)
	})

	s.addTool(mcp.NewTool("core.term.update",
		mcp.WithDescription("Update a term. Pass only changed fields as 'updates'."),
		mcp.WithNumber("id", mcp.Required()),
		mcp.WithObject("updates", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		return api.UpdateTerm(ctx, uintArg(args, "id"), mapArg(args, "updates"))
	})

	s.addTool(mcp.NewTool("core.term.delete",
		mcp.WithDescription("Delete a term by ID."),
		mcp.WithNumber("id", mcp.Required()),
	), "content", func(ctx context.Context, args map[string]any) (any, error) {
		err := api.DeleteTerm(ctx, uintArg(args, "id"))
		return map[string]any{"ok": err == nil}, err
	})
}

func taxonomyInputFromArgs(args map[string]any) coreapi.TaxonomyInput {
	in := coreapi.TaxonomyInput{
		Slug:        stringArg(args, "slug"),
		Label:       stringArg(args, "label"),
		LabelPlural: stringArg(args, "label_plural"),
		Description: stringArg(args, "description"),
	}
	if _, ok := args["hierarchical"]; ok {
		b := boolArg(args, "hierarchical")
		in.Hierarchical = &b
	}
	if raw, ok := args["node_types"]; ok {
		b, _ := json.Marshal(raw)
		var nt []string
		_ = json.Unmarshal(b, &nt)
		in.NodeTypes = nt
	}
	if raw, ok := args["fields"]; ok {
		b, _ := json.Marshal(raw)
		var fs []coreapi.NodeTypeField
		_ = json.Unmarshal(b, &fs)
		in.Fields = fs
	}
	return in
}
