package coreapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"strconv"
	"strings"
)

// dataCallTimeout bounds every DataCall statement (set_config local, so
// it only applies inside the call's own transaction).
const dataCallTimeout = "30s"

// buildDataCallSQL renders `SELECT * FROM "<schema>"."<fn>"($1, …, $n)`.
// fn must already have passed the dataFunctionName check; it is quoted
// anyway so the identifier can never be read as anything but a name.
//
// The schema qualification matters: pg_catalog is searched before the
// search_path, so an unqualified name that collides with a built-in
// (query_to_xml, pg_read_file, set_config, …) would call the built-in
// rather than the extension's function — and query_to_xml executes
// arbitrary SQL, sidestepping kernelPrivateTables.
func buildDataCallSQL(schema, fn string, nargs int) string {
	var b strings.Builder
	b.WriteString("SELECT * FROM ")
	b.WriteString(quoteIdent(schema))
	b.WriteByte('.')
	b.WriteString(quoteIdent(fn))
	b.WriteByte('(')
	for i := 1; i <= nargs; i++ {
		if i > 1 {
			b.WriteString(", ")
		}
		b.WriteByte('$')
		b.WriteString(strconv.Itoa(i))
	}
	b.WriteByte(')')
	return b.String()
}

// DataCall runs an extension-owned set-returning SQL function inside a
// transaction with a 30s statement timeout. Ownership is enforced by the
// capability guard; the name shape is re-checked here so internal
// callers can't build malformed SQL either. Maps/slices in args are
// JSON-encoded (bind them to jsonb parameters).
//
// It talks to database/sql directly rather than GORM: GORM would expand
// slice arguments into parenthesised lists and rewrite placeholders,
// and DataCall's contract is literal positional $n binding.
func (c *coreImpl) DataCall(ctx context.Context, fn string, args ...any) ([]map[string]any, error) {
	if !dataFunctionName.MatchString(fn) {
		return nil, NewValidation("invalid function name " + strconv.Quote(fn))
	}
	sqlDB, err := c.db.DB()
	if err != nil {
		return nil, NewInternal("data call: " + err.Error())
	}
	tx, err := sqlDB.BeginTx(ctx, nil)
	if err != nil {
		return nil, NewInternal("data call begin: " + err.Error())
	}
	defer func() { _ = tx.Rollback() }() // no-op after Commit

	// set_config(..., true) == SET LOCAL; current_schema() is where the
	// extension's migrations created its functions (same search_path).
	var schema sql.NullString
	if err := tx.QueryRowContext(ctx,
		"SELECT set_config('statement_timeout', $1, true), current_schema()", dataCallTimeout,
	).Scan(new(string), &schema); err != nil {
		return nil, NewInternal("data call setup: " + err.Error())
	}
	if !schema.Valid || schema.String == "" {
		return nil, NewInternal("data call: no current schema (empty search_path)")
	}

	bound := make([]any, len(args))
	for i, a := range args {
		bound[i] = jsonbEncode(a)
	}
	rows, err := tx.QueryContext(ctx, buildDataCallSQL(schema.String, fn, len(args)), bound...)
	if err != nil {
		return nil, NewInternal("data call " + fn + ": " + err.Error())
	}
	results, err := scanCallRows(rows)
	rows.Close()
	if err != nil {
		return nil, NewInternal("data call " + fn + " scan: " + err.Error())
	}
	if err := tx.Commit(); err != nil {
		return nil, NewInternal("data call " + fn + " commit: " + err.Error())
	}
	return results, nil
}

// scanCallRows is scanRows plus JSON decoding: json/jsonb columns are
// returned parsed (map/slice/scalar) instead of as raw strings, so
// rows survive the gRPC JSON round-trip as structured values. Always
// returns a non-nil slice so "no rows" encodes as [] rather than null.
func scanCallRows(rows *sql.Rows) ([]map[string]any, error) {
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	types, err := rows.ColumnTypes()
	if err != nil {
		return nil, err
	}
	isJSON := make([]bool, len(cols))
	for i, ct := range types {
		switch strings.ToUpper(ct.DatabaseTypeName()) {
		case "JSON", "JSONB":
			isJSON[i] = true
		}
	}

	results := []map[string]any{}
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
			row[col] = decodeCallValue(values[i], isJSON[i])
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

func decodeCallValue(v any, isJSON bool) any {
	var raw []byte
	switch t := v.(type) {
	case []byte:
		raw = t
	case string:
		if !isJSON {
			return t
		}
		raw = []byte(t)
	default:
		return v
	}
	if isJSON {
		var parsed any
		if err := json.Unmarshal(raw, &parsed); err == nil {
			return parsed
		}
	}
	return string(raw)
}
