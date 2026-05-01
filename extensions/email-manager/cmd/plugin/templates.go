package main

import (
	"context"
	"encoding/json"
	"math"
	"strings"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// This file owns the email-template CRUD handlers used by the
// admin UI. Each method is a thin wrapper around CoreAPI Data*
// calls — listing/sorting/paginating and validating input.

func (p *EmailManagerPlugin) listTemplates(ctx context.Context, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	params := req.GetQueryParams()
	page, perPage := parsePagination(params)

	tplSortable := map[string]string{
		"name":       "name",
		"slug":       "slug",
		"subject":    "subject_template",
		"created_at": "created_at",
		"updated_at": "updated_at",
	}
	orderBy := parseSort(params, tplSortable, "name ASC")

	var conds []string
	var args []any
	if search := params["search"]; search != "" {
		conds = append(conds, "(name ILIKE ? OR slug ILIKE ? OR subject_template ILIKE ?)")
		s := "%" + search + "%"
		args = append(args, s, s, s)
	}
	if cond, langArgs, ok := p.resolveLanguageFilter(ctx, params["language"]); ok {
		conds = append(conds, cond)
		args = append(args, langArgs...)
	}

	query := coreapi.DataStoreQuery{
		OrderBy: orderBy,
		Limit:   perPage,
		Offset:  (page - 1) * perPage,
	}
	if len(conds) > 0 {
		query.Raw = strings.Join(conds, " AND ")
		query.Args = args
	}

	result, err := p.host.DataQuery(ctx, "email_templates", query)
	if err != nil {
		return jsonError(500, "LIST_FAILED", "Failed to list email templates"), nil
	}

	// Strip heavy fields from list response.
	rows := stripFields(result.Rows, "body_template", "test_data")

	// total_all = same search filter, no language filter — so the language
	// dropdown can show "All languages (N)" if the UI ever surfaces it.
	var allConds []string
	var allArgs []any
	if search := params["search"]; search != "" {
		allConds = append(allConds, "(name ILIKE ? OR slug ILIKE ? OR subject_template ILIKE ?)")
		s := "%" + search + "%"
		allArgs = append(allArgs, s, s, s)
	}
	totalAll := p.countWhere(ctx, "email_templates", allConds, allArgs, "")

	totalPages := int(math.Ceil(float64(result.Total) / float64(perPage)))
	return jsonResponse(200, map[string]any{
		"data": rows,
		"meta": map[string]any{
			"total":       result.Total,
			"page":        page,
			"per_page":    perPage,
			"total_pages": totalPages,
			"total_all":   totalAll,
		},
	}), nil
}

func (p *EmailManagerPlugin) getTemplate(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	row, err := p.host.DataGet(ctx, "email_templates", id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Email template not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email template"), nil
	}
	return jsonResponse(200, map[string]any{"data": row}), nil
}

func (p *EmailManagerPlugin) createTemplate(ctx context.Context, body []byte) (*pb.PluginHTTPResponse, error) {
	var req struct {
		Slug            string `json:"slug"`
		Name            string `json:"name"`
		LanguageID      *int   `json:"language_id"`
		SubjectTemplate string `json:"subject_template"`
		BodyTemplate    string `json:"body_template"`
		TestData        any    `json:"test_data"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		return jsonError(400, "INVALID_BODY", "Invalid request body"), nil
	}

	fields := map[string]string{}
	if req.Slug == "" {
		fields["slug"] = "Slug is required"
	}
	if req.Name == "" {
		fields["name"] = "Name is required"
	}
	if req.SubjectTemplate == "" {
		fields["subject_template"] = "Subject template is required"
	}
	if req.BodyTemplate == "" {
		fields["body_template"] = "Body template is required"
	}
	if len(fields) > 0 {
		return jsonValidationError(fields), nil
	}

	testData := "{}"
	if req.TestData != nil {
		if td, err := json.Marshal(req.TestData); err == nil && string(td) != "null" {
			testData = string(td)
		}
	}

	record := map[string]any{
		"slug":             req.Slug,
		"name":             req.Name,
		"subject_template": req.SubjectTemplate,
		"body_template":    req.BodyTemplate,
		"test_data":        testData,
	}
	if req.LanguageID != nil {
		record["language_id"] = *req.LanguageID
	}

	created, err := p.host.DataCreate(ctx, "email_templates", record)
	if err != nil {
		return jsonError(500, "CREATE_FAILED", "Failed to create email template"), nil
	}

	return jsonResponse(201, map[string]any{"data": created}), nil
}

func (p *EmailManagerPlugin) updateTemplate(ctx context.Context, id uint, body []byte) (*pb.PluginHTTPResponse, error) {
	// Verify exists.
	_, err := p.host.DataGet(ctx, "email_templates", id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Email template not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email template"), nil
	}

	var updates map[string]any
	if err := json.Unmarshal(body, &updates); err != nil {
		return jsonError(400, "INVALID_BODY", "Invalid request body"), nil
	}

	// Strip read-only fields.
	delete(updates, "id")
	delete(updates, "created_at")
	delete(updates, "updated_at")

	if len(updates) == 0 {
		return jsonError(400, "NO_UPDATES", "No valid fields to update"), nil
	}

	// Marshal test_data if it's a complex type.
	if td, ok := updates["test_data"]; ok && td != nil {
		switch td.(type) {
		case string:
			// already a string, fine
		default:
			if b, err := json.Marshal(td); err == nil {
				updates["test_data"] = string(b)
			}
		}
	}

	// `language_id: null` means universal fallback. DataUpdate maps Go nil
	// to a SQL NULL parameter, so we pass it through directly — no DataExec
	// workaround (extensions can't call DataExec, it's internal-only).
	updates["updated_at"] = time.Now().Format(time.RFC3339)

	if err := p.host.DataUpdate(ctx, "email_templates", id, updates); err != nil {
		return jsonError(500, "UPDATE_FAILED", "Failed to update email template"), nil
	}

	row, err := p.host.DataGet(ctx, "email_templates", id)
	if err != nil {
		return jsonError(500, "FETCH_FAILED", "Failed to fetch updated email template"), nil
	}

	return jsonResponse(200, map[string]any{"data": row}), nil
}

func (p *EmailManagerPlugin) deleteTemplate(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	_, err := p.host.DataGet(ctx, "email_templates", id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Email template not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email template"), nil
	}

	if err := p.host.DataDelete(ctx, "email_templates", id); err != nil {
		return jsonError(500, "DELETE_FAILED", "Failed to delete email template"), nil
	}

	return &pb.PluginHTTPResponse{StatusCode: 204, Headers: map[string]string{"Content-Type": "application/json"}}, nil
}

// ---------------------------------------------------------------------------
// Email Rules
// ---------------------------------------------------------------------------
