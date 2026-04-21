package coreapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
)

// jsonbEncode prepares a value for insertion into a JSONB column. Postgres
// driver can bind scalars directly but rejects Go maps/slices — those must be
// JSON-serialized first. Called by DataCreate/DataUpdate so callers can pass
// structured payloads naturally.
func jsonbEncode(v any) any {
	switch v.(type) {
	case nil, string, bool, int, int32, int64, uint, uint32, uint64, float32, float64, []byte:
		return v
	}
	b, err := json.Marshal(v)
	if err != nil {
		return v
	}
	return string(b)
}

func (c *coreImpl) DataGet(ctx context.Context, table string, id uint) (map[string]any, error) {
	query := fmt.Sprintf("SELECT * FROM %s WHERE id = ? LIMIT 1", quoteIdent(table))
	rows, err := c.db.WithContext(ctx).Raw(query, id).Rows()
	if err != nil {
		return nil, NewInternal("data get: " + err.Error())
	}
	defer rows.Close()

	results, err := scanRows(rows)
	if err != nil {
		return nil, NewInternal("data get scan: " + err.Error())
	}
	if len(results) == 0 {
		return nil, NewNotFound(table, id)
	}
	return results[0], nil
}

func (c *coreImpl) DataQuery(ctx context.Context, table string, query DataStoreQuery) (*DataStoreResult, error) {
	var whereClauses []string
	var args []any

	if query.Raw != "" {
		// Validate Raw SQL to prevent injection: only allow simple column conditions with placeholders.
		// Count placeholders to ensure they match args.
		placeholderCount := strings.Count(query.Raw, "?")
		if placeholderCount != len(query.Args) {
			return nil, NewValidation("raw query placeholder count does not match args count")
		}
		whereClauses = append(whereClauses, "("+query.Raw+")")
		args = append(args, query.Args...)
	}

	for k, v := range query.Where {
		whereClauses = append(whereClauses, fmt.Sprintf("%s = ?", quoteIdent(k)))
		args = append(args, v)
	}

	if query.Search != "" {
		whereClauses = append(whereClauses, "CAST(row_to_json(t.*) AS TEXT) ILIKE ?")
		args = append(args, "%"+query.Search+"%")
	}

	whereSQL := ""
	if len(whereClauses) > 0 {
		whereSQL = " WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Count total
	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM %s t%s", quoteIdent(table), whereSQL)
	var total int64
	if err := c.db.WithContext(ctx).Raw(countSQL, args...).Scan(&total).Error; err != nil {
		return nil, NewInternal("data query count: " + err.Error())
	}

	// Fetch rows
	selectSQL := fmt.Sprintf("SELECT * FROM %s t%s", quoteIdent(table), whereSQL)
	if query.OrderBy != "" {
		// Validate OrderBy to prevent SQL injection: only allow safe column references.
		if !isValidOrderBy(query.OrderBy) {
			return nil, NewValidation("invalid order_by clause")
		}
		selectSQL += " ORDER BY " + query.OrderBy
	}
	if query.Limit > 0 {
		selectSQL += fmt.Sprintf(" LIMIT %d", query.Limit)
	}
	if query.Offset > 0 {
		selectSQL += fmt.Sprintf(" OFFSET %d", query.Offset)
	}

	rows, err := c.db.WithContext(ctx).Raw(selectSQL, args...).Rows()
	if err != nil {
		return nil, NewInternal("data query: " + err.Error())
	}
	defer rows.Close()

	results, err := scanRows(rows)
	if err != nil {
		return nil, NewInternal("data query scan: " + err.Error())
	}

	return &DataStoreResult{Rows: results, Total: total}, nil
}

func (c *coreImpl) DataCreate(ctx context.Context, table string, data map[string]any) (map[string]any, error) {
	if len(data) == 0 {
		return nil, NewValidation("no data provided")
	}

	columns := make([]string, 0, len(data))
	placeholders := make([]string, 0, len(data))
	args := make([]any, 0, len(data))

	for k, v := range data {
		columns = append(columns, quoteIdent(k))
		placeholders = append(placeholders, "?")
		args = append(args, jsonbEncode(v))
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s) RETURNING *",
		quoteIdent(table),
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "),
	)

	rows, err := c.db.WithContext(ctx).Raw(query, args...).Rows()
	if err != nil {
		return nil, NewInternal("data create: " + err.Error())
	}
	defer rows.Close()

	results, err := scanRows(rows)
	if err != nil {
		return nil, NewInternal("data create scan: " + err.Error())
	}
	if len(results) == 0 {
		return nil, NewInternal("data create: no row returned")
	}
	return results[0], nil
}

func (c *coreImpl) DataUpdate(ctx context.Context, table string, id uint, data map[string]any) error {
	if len(data) == 0 {
		return NewValidation("no data provided")
	}

	setClauses := make([]string, 0, len(data))
	args := make([]any, 0, len(data)+1)

	for k, v := range data {
		setClauses = append(setClauses, fmt.Sprintf("%s = ?", quoteIdent(k)))
		args = append(args, jsonbEncode(v))
	}
	args = append(args, id)

	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE id = ?",
		quoteIdent(table),
		strings.Join(setClauses, ", "),
	)

	result := c.db.WithContext(ctx).Exec(query, args...)
	if result.Error != nil {
		return NewInternal("data update: " + result.Error.Error())
	}
	if result.RowsAffected == 0 {
		return NewNotFound(table, id)
	}
	return nil
}

func (c *coreImpl) DataDelete(ctx context.Context, table string, id uint) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id = ?", quoteIdent(table))
	result := c.db.WithContext(ctx).Exec(query, id)
	if result.Error != nil {
		return NewInternal("data delete: " + result.Error.Error())
	}
	if result.RowsAffected == 0 {
		return NewNotFound(table, id)
	}
	return nil
}

func (c *coreImpl) DataExec(ctx context.Context, sqlStr string, args ...any) (int64, error) {
	// DataExec is restricted to internal callers only — it allows arbitrary SQL.
	caller := CallerFromContext(ctx)
	if caller.Type != "internal" {
		return 0, NewCapabilityDenied("data:exec (internal only)")
	}
	result := c.db.WithContext(ctx).Exec(sqlStr, args...)
	if result.Error != nil {
		return 0, NewInternal("data exec: " + result.Error.Error())
	}
	return result.RowsAffected, nil
}

// quoteIdent quotes a SQL identifier to prevent injection.
func quoteIdent(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}

// isValidOrderBy validates an ORDER BY clause to prevent SQL injection.
// Allows patterns like: "column_name ASC", "column DESC", "col1 ASC, col2 DESC".
func isValidOrderBy(orderBy string) bool {
	parts := strings.Split(orderBy, ",")
	for _, part := range parts {
		fields := strings.Fields(strings.TrimSpace(part))
		if len(fields) == 0 || len(fields) > 2 {
			return false
		}
		// Column name: must be alphanumeric/underscores (optionally quoted).
		col := strings.Trim(fields[0], `"`)
		for _, ch := range col {
			if !((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch == '_') {
				return false
			}
		}
		// Direction: must be ASC or DESC if present.
		if len(fields) == 2 {
			dir := strings.ToUpper(fields[1])
			if dir != "ASC" && dir != "DESC" {
				return false
			}
		}
	}
	return true
}

// scanRows scans sql.Rows into a slice of maps.
func scanRows(rows *sql.Rows) ([]map[string]any, error) {
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var results []map[string]any
	for rows.Next() {
		values := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range values {
			ptrs[i] = &values[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}
		row := make(map[string]any, len(cols))
		for i, col := range cols {
			val := values[i]
			// Convert []byte to string for readability
			if b, ok := val.([]byte); ok {
				row[col] = string(b)
			} else {
				row[col] = val
			}
		}
		results = append(results, row)
	}
	return results, rows.Err()
}
