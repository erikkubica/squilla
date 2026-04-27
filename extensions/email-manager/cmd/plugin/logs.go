package main

import (
	"context"
	"math"
	"strings"
	"time"

	"vibecms/internal/coreapi"
	pb "vibecms/pkg/plugin/proto"
)

// This file owns the email-log read endpoints + the resend flow.
// Logs are written by the dispatcher when emails are sent and are
// rotated by the kernel retention loop.

func (p *EmailManagerPlugin) listLogs(ctx context.Context, req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	params := req.GetQueryParams()
	page, perPage := parsePagination(params)

	query := coreapi.DataStoreQuery{
		OrderBy: "created_at DESC",
		Limit:   perPage,
		Offset:  (page - 1) * perPage,
	}

	// Build WHERE conditions via Raw.
	var conditions []string
	var args []any

	if status := params["status"]; status != "" {
		conditions = append(conditions, "status = ?")
		args = append(args, status)
	}
	if action := params["action"]; action != "" {
		conditions = append(conditions, "action = ?")
		args = append(args, action)
	}
	if recipient := params["recipient"]; recipient != "" {
		conditions = append(conditions, "recipient_email ILIKE ?")
		args = append(args, "%"+recipient+"%")
	}
	if dateFrom := params["date_from"]; dateFrom != "" {
		if t, err := time.Parse("2006-01-02", dateFrom); err == nil {
			conditions = append(conditions, "created_at >= ?")
			args = append(args, t.Format(time.RFC3339))
		}
	}
	if dateTo := params["date_to"]; dateTo != "" {
		if t, err := time.Parse("2006-01-02", dateTo); err == nil {
			conditions = append(conditions, "created_at < ?")
			args = append(args, t.AddDate(0, 0, 1).Format(time.RFC3339))
		}
	}

	if len(conditions) > 0 {
		query.Raw = strings.Join(conditions, " AND ")
		query.Args = args
	}

	result, err := p.host.DataQuery(ctx, "email_logs", query)
	if err != nil {
		return jsonError(500, "LIST_FAILED", "Failed to list email logs"), nil
	}

	totalPages := int(math.Ceil(float64(result.Total) / float64(perPage)))
	resp := map[string]any{
		"data": result.Rows,
		"meta": map[string]any{
			"total":       result.Total,
			"page":        page,
			"per_page":    perPage,
			"total_pages": totalPages,
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
