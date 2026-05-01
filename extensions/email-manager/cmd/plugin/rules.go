package main

import (
	"context"
	"encoding/json"
	"math"
	"strconv"
	"strings"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// This file owns the email-rule CRUD handlers. Rules connect
// kernel events (e.g. user.registered) to email templates so
// the dispatcher knows what to send when.

func (p *EmailManagerPlugin) listRules(ctx context.Context, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	params := req.GetQueryParams()

	// Default to a high limit for back-compat with callers that expect the
	// full rule set (the legacy admin UI fetched all rules at once). When
	// the caller passes `page` or `per_page` explicitly we honour them.
	page, perPage := 1, 1000
	if v := params["per_page"]; v != "" {
		if n, perr := strconv.Atoi(v); perr == nil && n >= 1 && n <= 100 {
			perPage = n
		}
	}
	if v := params["page"]; v != "" {
		if n, perr := strconv.Atoi(v); perr == nil && n >= 1 {
			page = n
		}
	}

	ruleSortable := map[string]string{
		"action":         "action",
		"recipient_type": "recipient_type",
		"created_at":     "created_at",
		"updated_at":     "updated_at",
	}
	orderBy := parseSort(params, ruleSortable, "action ASC")

	var baseConds []string
	var baseArgs []any
	if search := params["search"]; search != "" {
		baseConds = append(baseConds, "(action ILIKE ? OR node_type ILIKE ? OR recipient_value ILIKE ?)")
		s := "%" + search + "%"
		baseArgs = append(baseArgs, s, s, s)
	}

	conds := append([]string{}, baseConds...)
	args := append([]any{}, baseArgs...)
	switch params["enabled"] {
	case "true", "enabled":
		conds = append(conds, "enabled = ?")
		args = append(args, true)
	case "false", "disabled":
		conds = append(conds, "enabled = ?")
		args = append(args, false)
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

	result, err := p.host.DataQuery(ctx, "email_rules", query)
	if err != nil {
		return jsonError(500, "LIST_FAILED", "Failed to list email rules"), nil
	}

	// Enrich rules with their template data.
	rows := result.Rows
	for i, row := range rows {
		tplID := toUint(row["template_id"])
		if tplID > 0 {
			tpl, err := p.host.DataGet(ctx, "email_templates", tplID)
			if err == nil {
				rows[i]["template"] = tpl
			}
		}
	}

	totalAll := p.countWhere(ctx, "email_rules", baseConds, baseArgs, "")
	enabledCount := p.countWhere(ctx, "email_rules", baseConds, baseArgs, "enabled = ?", true)
	disabledCount := p.countWhere(ctx, "email_rules", baseConds, baseArgs, "enabled = ?", false)

	totalPages := int(math.Ceil(float64(result.Total) / float64(perPage)))
	if totalPages < 1 {
		totalPages = 1
	}
	return jsonResponse(200, map[string]any{
		"data": rows,
		"meta": map[string]any{
			"total":          result.Total,
			"page":           page,
			"per_page":       perPage,
			"total_pages":    totalPages,
			"total_all":      totalAll,
			"enabled_count":  enabledCount,
			"disabled_count": disabledCount,
		},
	}), nil
}

func (p *EmailManagerPlugin) getRule(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	row, err := p.host.DataGet(ctx, "email_rules", id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Email rule not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email rule"), nil
	}

	// Enrich with template.
	tplID := toUint(row["template_id"])
	if tplID > 0 {
		tpl, err := p.host.DataGet(ctx, "email_templates", tplID)
		if err == nil {
			row["template"] = tpl
		}
	}

	return jsonResponse(200, map[string]any{"data": row}), nil
}

func (p *EmailManagerPlugin) createRule(ctx context.Context, body []byte) (*pb.PluginHTTPResponse, error) {
	var req struct {
		Action         string  `json:"action"`
		NodeType       *string `json:"node_type"`
		TemplateID     int     `json:"template_id"`
		RecipientType  string  `json:"recipient_type"`
		RecipientValue string  `json:"recipient_value"`
		Enabled        *bool   `json:"enabled"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		return jsonError(400, "INVALID_BODY", "Invalid request body"), nil
	}

	fields := map[string]string{}
	if req.Action == "" {
		fields["action"] = "Action is required"
	}
	if req.TemplateID == 0 {
		fields["template_id"] = "Template ID is required"
	}
	if req.RecipientType == "" {
		fields["recipient_type"] = "Recipient type is required"
	}
	if (req.RecipientType == "role" || req.RecipientType == "fixed") && req.RecipientValue == "" {
		fields["recipient_value"] = "Recipient value is required"
	}
	if len(fields) > 0 {
		return jsonValidationError(fields), nil
	}

	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	record := map[string]any{
		"action":          req.Action,
		"template_id":     req.TemplateID,
		"recipient_type":  req.RecipientType,
		"recipient_value": req.RecipientValue,
		"enabled":         enabled,
	}
	if req.NodeType != nil {
		record["node_type"] = *req.NodeType
	}

	created, err := p.host.DataCreate(ctx, "email_rules", record)
	if err != nil {
		return jsonError(500, "CREATE_FAILED", "Failed to create email rule"), nil
	}

	// Enrich with template.
	tplID := toUint(created["template_id"])
	if tplID > 0 {
		tpl, tplErr := p.host.DataGet(ctx, "email_templates", tplID)
		if tplErr == nil {
			created["template"] = tpl
		}
	}

	return jsonResponse(201, map[string]any{"data": created}), nil
}

func (p *EmailManagerPlugin) updateRule(ctx context.Context, id uint, body []byte) (*pb.PluginHTTPResponse, error) {
	_, err := p.host.DataGet(ctx, "email_rules", id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Email rule not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email rule"), nil
	}

	var updates map[string]any
	if err := json.Unmarshal(body, &updates); err != nil {
		return jsonError(400, "INVALID_BODY", "Invalid request body"), nil
	}

	delete(updates, "id")
	delete(updates, "created_at")
	delete(updates, "updated_at")

	if len(updates) == 0 {
		return jsonError(400, "NO_UPDATES", "No valid fields to update"), nil
	}

	updates["updated_at"] = time.Now().Format(time.RFC3339)

	if err := p.host.DataUpdate(ctx, "email_rules", id, updates); err != nil {
		return jsonError(500, "UPDATE_FAILED", "Failed to update email rule"), nil
	}

	row, err := p.host.DataGet(ctx, "email_rules", id)
	if err != nil {
		return jsonError(500, "FETCH_FAILED", "Failed to fetch updated email rule"), nil
	}

	// Enrich with template.
	tplID := toUint(row["template_id"])
	if tplID > 0 {
		tpl, tplErr := p.host.DataGet(ctx, "email_templates", tplID)
		if tplErr == nil {
			row["template"] = tpl
		}
	}

	return jsonResponse(200, map[string]any{"data": row}), nil
}

func (p *EmailManagerPlugin) deleteRule(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	_, err := p.host.DataGet(ctx, "email_rules", id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Email rule not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email rule"), nil
	}

	if err := p.host.DataDelete(ctx, "email_rules", id); err != nil {
		return jsonError(500, "DELETE_FAILED", "Failed to delete email rule"), nil
	}

	return &pb.PluginHTTPResponse{StatusCode: 204, Headers: map[string]string{"Content-Type": "application/json"}}, nil
}

// ---------------------------------------------------------------------------
// Email Logs
// ---------------------------------------------------------------------------
