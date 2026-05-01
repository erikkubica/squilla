package main

import (
	"context"
	"math"
	"strings"
	"time"

	"squilla/internal/coreapi"
	pb "squilla/pkg/plugin/proto"
)

// This file owns the email-log read endpoints + the resend flow.
// Logs are written by the dispatcher when emails are sent and are
// rotated by the kernel retention loop.

func (p *EmailManagerPlugin) listLogs(ctx context.Context, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	params := req.GetQueryParams()
	page, perPage := parsePagination(params)

	// Whitelist sort columns. User-supplied keys map to real SQL columns.
	logSortable := map[string]string{
		"created_at":      "created_at",
		"recipient_email": "recipient_email",
		"recipient":       "recipient_email",
		"status":          "status",
		"action":          "action",
		"subject":         "subject",
	}
	orderBy := parseSort(params, logSortable, "created_at DESC")

	// Base conditions (search + date range) — applied to BOTH the tab counts
	// and the main list. The status filter is the active-tab filter, applied
	// only to the main list so per-tab counts reflect the available pool.
	var baseConds []string
	var baseArgs []any

	if action := params["action"]; action != "" {
		baseConds = append(baseConds, "action = ?")
		baseArgs = append(baseArgs, action)
	}
	if recipient := params["recipient"]; recipient != "" {
		baseConds = append(baseConds, "recipient_email ILIKE ?")
		baseArgs = append(baseArgs, "%"+recipient+"%")
	}
	if dateFrom := params["date_from"]; dateFrom != "" {
		if t, err := time.Parse("2006-01-02", dateFrom); err == nil {
			baseConds = append(baseConds, "created_at >= ?")
			baseArgs = append(baseArgs, t.Format(time.RFC3339))
		}
	}
	if dateTo := params["date_to"]; dateTo != "" {
		if t, err := time.Parse("2006-01-02", dateTo); err == nil {
			baseConds = append(baseConds, "created_at < ?")
			baseArgs = append(baseArgs, t.AddDate(0, 0, 1).Format(time.RFC3339))
		}
	}

	// Active tab filter — appended to baseConds for the main list only.
	conds := append([]string{}, baseConds...)
	args := append([]any{}, baseArgs...)
	if status := params["status"]; status != "" && status != "all" {
		conds = append(conds, "status = ?")
		args = append(args, status)
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

	result, err := p.host.DataQuery(ctx, "email_logs", query)
	if err != nil {
		return jsonError(500, "LIST_FAILED", "Failed to list email logs"), nil
	}

	// Per-tab counts use the search/date-filtered set (NOT the active status).
	totalAll := p.countWhere(ctx, "email_logs", baseConds, baseArgs, "")
	sentCount := p.countWhere(ctx, "email_logs", baseConds, baseArgs, "status = ?", "sent")
	failedCount := p.countWhere(ctx, "email_logs", baseConds, baseArgs, "status = ?", "failed")
	pendingCount := p.countWhere(ctx, "email_logs", baseConds, baseArgs, "status = ?", "pending")

	totalPages := int(math.Ceil(float64(result.Total) / float64(perPage)))
	resp := map[string]any{
		"data": result.Rows,
		"meta": map[string]any{
			"total":         result.Total,
			"page":          page,
			"per_page":      perPage,
			"total_pages":   totalPages,
			"total_all":     totalAll,
			"sent_count":    sentCount,
			"failed_count":  failedCount,
			"pending_count": pendingCount,
		},
	}

	return jsonResponse(200, resp), nil
}

func (p *EmailManagerPlugin) getLog(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	row, err := p.host.DataGet(ctx, "email_logs", id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Email log not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email log"), nil
	}
	return jsonResponse(200, map[string]any{"data": row}), nil
}

func (p *EmailManagerPlugin) resendLog(ctx context.Context, id uint) (*pb.PluginHTTPResponse, error) {
	row, err := p.host.DataGet(ctx, "email_logs", id)
	if err != nil {
		if isNotFound(err) {
			return jsonError(404, "NOT_FOUND", "Email log not found"), nil
		}
		return jsonError(500, "FETCH_FAILED", "Failed to fetch email log"), nil
	}

	recipientEmail, _ := row["recipient_email"].(string)
	subject, _ := row["subject"].(string)
	renderedBody, _ := row["rendered_body"].(string)
	templateSlug, _ := row["template_slug"].(string)

	if recipientEmail == "" {
		return jsonError(400, "NO_RECIPIENT", "Log has no recipient email"), nil
	}

	// Use the CoreAPI SendEmail to dispatch via the configured provider.
	// SendEmail waits for the provider to complete (synchronous event delivery).
	sendErr := p.host.SendEmail(ctx, coreapi.EmailRequest{
		To:      []string{recipientEmail},
		Subject: subject,
		HTML:    renderedBody,
	})

	status := "sent"
	var errMsg interface{}
	if sendErr != nil {
		status = "failed"
		errMsg = sendErr.Error()
	}

	// Log the resend attempt.
	var ruleID interface{}
	if rid, ok := row["rule_id"]; ok {
		ruleID = rid
	}

	newLog := map[string]any{
		"rule_id":         ruleID,
		"template_slug":   templateSlug,
		"action":          "resend",
		"recipient_email": recipientEmail,
		"subject":         subject,
		"rendered_body":   renderedBody,
		"status":          status,
		"error_message":   errMsg,
	}

	created, createErr := p.host.DataCreate(ctx, "email_logs", newLog)
	if createErr != nil {
		_ = created // ignore
	}

	if sendErr != nil {
		return jsonError(500, "SEND_FAILED", "Failed to resend email: "+sendErr.Error()), nil
	}

	if created != nil {
		return jsonResponse(200, map[string]any{"data": created}), nil
	}
	return jsonResponse(200, map[string]any{"data": newLog}), nil
}

// ---------------------------------------------------------------------------
// Email Layouts
// ---------------------------------------------------------------------------
