package coreapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
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
		return nil, dataInternal("data get", err)
	}
	defer rows.Close()

	results, err := scanRows(rows)
	if err != nil {
		return nil, dataInternal("data get scan", err)
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
		// Non-internal callers (gRPC extensions) get the conservative
		// fragment grammar: without it a data:read extension owning one
		// table could sub-select users/sessions/mcp_tokens through Raw.
		if CallerFromContext(ctx).Type != "internal" {
			if err := ValidateRawWhere(query.Raw); err != nil {
				return nil, err
			}
		}
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
		return nil, dataInternal("data query count", err)
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
		return nil, dataInternal("data query", err)
	}
	defer rows.Close()

	results, err := scanRows(rows)
	if err != nil {
		return nil, dataInternal("data query scan", err)
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
		return nil, dataInternal("data create", err)
	}
	defer rows.Close()

	results, err := scanRows(rows)
	if err != nil {
		return nil, dataInternal("data create scan", err)
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
		return dataInternal("data update", result.Error)
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
		return dataInternal("data delete", result.Error)
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

// dataInternal logs the driver error server-side and returns a generic
// internal error. Driver messages carry SQL fragments, column/constraint
// names and values; Data* results flow back to gRPC extensions and MCP
// agents, so the detail stays in the log.
func dataInternal(op string, err error) error {
	log.Printf("[coreapi] %s: %v", op, err)
	return NewInternal(op + " failed")
}

// quoteIdent quotes a SQL identifier to prevent injection.
func quoteIdent(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}

// isValidOrderBy validates an ORDER BY clause to prevent SQL injection.
// It is a whitelist grammar, not a blacklist:
//
//	clause := term { "," term }
//	term   := expr [ ASC | DESC ] [ NULLS ( FIRST | LAST ) ]
//	expr   := column | COALESCE "(" column { "," column } ")"
//	column := [A-Za-z0-9_]+ | "\"" [A-Za-z0-9_]+ "\""
//
// Examples: "created_at DESC", "col1 ASC, col2 DESC",
// "COALESCE(published_at, created_at) DESC NULLS LAST". COALESCE over
// plain columns is the only expression allowed (the SEO extension sorts
// nodes that way); anything else — other function calls, casts, operators,
// sub-selects, comments, semicolons — is rejected.
func isValidOrderBy(orderBy string) bool {
	toks, ok := lexOrderBy(orderBy)
	if !ok || len(toks) == 0 {
		return false
	}
	i := 0
	peek := func() string {
		if i < len(toks) {
			return toks[i]
		}
		return ""
	}
	for {
		// expr
		t := peek()
		switch {
		case strings.EqualFold(t, "coalesce") && i+1 < len(toks) && toks[i+1] == "(":
			i += 2
			for {
				if !isOrderColumn(peek()) {
					return false
				}
				i++
				if peek() == "," {
					i++
					continue
				}
				if peek() != ")" {
					return false
				}
				i++
				break
			}
		case isOrderColumn(t):
			i++
		default:
			return false
		}
		// direction
		if d := strings.ToUpper(peek()); d == "ASC" || d == "DESC" {
			i++
		}
		// nulls ordering
		if strings.EqualFold(peek(), "nulls") {
			i++
			if n := strings.ToUpper(peek()); n != "FIRST" && n != "LAST" {
				return false
			}
			i++
		}
		if i == len(toks) {
			return true
		}
		if peek() != "," {
			return false
		}
		i++
		if i == len(toks) {
			return false // trailing comma
		}
	}
}

// lexOrderBy splits an ORDER BY clause into words, quoted identifiers,
// parentheses and commas. Any other character fails the lex.
func lexOrderBy(s string) ([]string, bool) {
	var toks []string
	for i := 0; i < len(s); {
		c := s[i]
		switch {
		case c == ' ' || c == '\t' || c == '\n' || c == '\r':
			i++
		case c == '(' || c == ')' || c == ',':
			toks = append(toks, string(c))
			i++
		case c == '"':
			j := i + 1
			for j < len(s) && isIdentByte(s[j]) {
				j++
			}
			if j >= len(s) || s[j] != '"' || j == i+1 {
				return nil, false
			}
			toks = append(toks, s[i:j+1])
			i = j + 1
		case isIdentByte(c):
			j := i
			for j < len(s) && isIdentByte(s[j]) {
				j++
			}
			toks = append(toks, s[i:j])
			i = j
		default:
			return nil, false
		}
	}
	return toks, true
}

func isIdentByte(c byte) bool {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_'
}

// isOrderColumn accepts a bare or double-quoted column token from
// lexOrderBy. Keywords that only make sense as modifiers are refused so
// "ASC" alone or "NULLS" can't masquerade as a column.
func isOrderColumn(t string) bool {
	if t == "" || t == "(" || t == ")" || t == "," {
		return false
	}
	if t[0] == '"' {
		return true // lexer already guaranteed "[A-Za-z0-9_]+"
	}
	switch strings.ToUpper(t) {
	case "ASC", "DESC", "NULLS", "FIRST", "LAST", "COALESCE":
		return false
	}
	return true
}

// maxRawWhereLen bounds the size of a caller-supplied WHERE fragment.
const maxRawWhereLen = 2000

// rawWhereKeywords are the only SQL words allowed in a raw WHERE fragment
// besides column names, the allow-listed functions and cast types.
var rawWhereKeywords = map[string]bool{
	"and": true, "or": true, "not": true, "is": true, "null": true,
	"like": true, "ilike": true, "in": true, "between": true,
	"true": true, "false": true,
}

// rawWhereFunctions is the complete function allow-list for raw WHERE
// fragments. Everything else followed by "(" is rejected.
var rawWhereFunctions = map[string]bool{
	"lower": true, "upper": true, "coalesce": true, "now": true,
}

// rawWhereCastTypes are the type names accepted after "::".
var rawWhereCastTypes = map[string]bool{
	"text": true, "varchar": true, "int": true, "integer": true, "bigint": true,
	"numeric": true, "boolean": true, "bool": true, "date": true,
	"timestamp": true, "timestamptz": true, "json": true, "jsonb": true, "uuid": true,
}

// rawWhereDenied are words that may never appear as a bare identifier.
// Sub-queries need SELECT/TABLE/VALUES/WITH, so rejecting those (plus
// function calls outside the allow-list) closes the cross-table read; the
// rest is defence in depth.
var rawWhereDenied = map[string]bool{
	"select": true, "union": true, "intersect": true, "except": true,
	"from": true, "with": true, "table": true, "values": true,
	"insert": true, "update": true, "delete": true, "merge": true,
	"drop": true, "alter": true, "create": true, "truncate": true,
	"grant": true, "revoke": true, "copy": true, "execute": true, "exec": true,
	"into": true, "returning": true, "join": true, "lateral": true,
	"case": true, "when": true, "then": true, "else": true, "end": true,
	"do": true, "call": true, "set": true, "current_setting": true, "set_config": true,
}

// ValidateRawWhere checks a caller-supplied WHERE fragment (DataStoreQuery.Raw)
// against a conservative grammar. It is applied to every non-internal caller
// of DataQuery (gRPC extensions) and to MCP's core.data.query. Bound values
// must travel as "?" placeholders.
//
// Accepted tokens:
//   - column names [A-Za-z_][A-Za-z0-9_]* (unqualified; not pg_*; not a
//     denied keyword)
//   - keywords AND OR NOT IS NULL LIKE ILIKE IN BETWEEN TRUE FALSE
//   - function calls lower() upper() coalesce() now() only
//   - "?" placeholders, integer/decimal numbers, single-quoted string
//     literals (” escape only; a prefix such as E'..' is rejected)
//   - operators = <> != < > <= >= -> ->> @> <@ , ( ) and ::<type> casts
//     where <type> is one of rawWhereCastTypes
//
// Everything else is rejected, which covers ";", comments ("--", "/*"),
// dollar quoting, double-quoted identifiers, qualified names
// (schema.table), arithmetic and sub-queries. Keyword checks are
// case-insensitive and never look inside string literals.
func ValidateRawWhere(frag string) error {
	if len(frag) > maxRawWhereLen {
		return NewValidation("raw where fragment too long")
	}
	bad := func(why string) error {
		return NewValidation("raw where fragment rejected: " + why)
	}
	depth := 0
	for i := 0; i < len(frag); {
		c := frag[i]
		switch {
		case c == ' ' || c == '\t' || c == '\n' || c == '\r':
			i++
		case c == '?':
			i++
		case c == '(':
			depth++
			i++
		case c == ')':
			depth--
			if depth < 0 {
				return bad("unbalanced parentheses")
			}
			i++
		case c == ',':
			i++
		case c == '\'':
			j := i + 1
			for {
				if j >= len(frag) {
					return bad("unterminated string literal")
				}
				if frag[j] == '\'' {
					if j+1 < len(frag) && frag[j+1] == '\'' {
						j += 2
						continue
					}
					break
				}
				j++
			}
			i = j + 1
		case c >= '0' && c <= '9':
			j := i
			for j < len(frag) && frag[j] >= '0' && frag[j] <= '9' {
				j++
			}
			if j < len(frag) && frag[j] == '.' {
				j++
				for j < len(frag) && frag[j] >= '0' && frag[j] <= '9' {
					j++
				}
			}
			if j < len(frag) && (isIdentByte(frag[j]) || frag[j] == '\'') {
				return bad("malformed number")
			}
			i = j
		case (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_':
			j := i
			for j < len(frag) && isIdentByte(frag[j]) {
				j++
			}
			word := strings.ToLower(frag[i:j])
			if j < len(frag) && (frag[j] == '\'' || frag[j] == '.' || frag[j] == '"' || frag[j] == '&') {
				return bad("prefixed literals and qualified names are not allowed")
			}
			// Next non-space char decides whether this is a call.
			k := j
			for k < len(frag) && (frag[k] == ' ' || frag[k] == '\t' || frag[k] == '\n' || frag[k] == '\r') {
				k++
			}
			isCall := k < len(frag) && frag[k] == '('
			switch {
			case rawWhereDenied[word] || strings.HasPrefix(word, "pg_"):
				return bad("keyword " + strconv.Quote(word) + " is not allowed")
			case isCall && rawWhereFunctions[word]:
			case isCall && word == "in":
			case isCall && (word == "and" || word == "or" || word == "not"):
			case isCall:
				return bad("function " + strconv.Quote(word) + " is not allowed")
			}
			i = j
		case c == ':':
			if i+1 >= len(frag) || frag[i+1] != ':' {
				return bad("unexpected ':'")
			}
			j := i + 2
			for j < len(frag) && frag[j] == ' ' {
				j++
			}
			k := j
			for k < len(frag) && isIdentByte(frag[k]) {
				k++
			}
			if !rawWhereCastTypes[strings.ToLower(frag[j:k])] {
				return bad("cast type not allowed")
			}
			i = k
		case c == '=':
			i++
		case c == '<' || c == '>' || c == '!':
			// <, >, <=, >=, <>, !=, <@
			j := i + 1
			if j < len(frag) && (frag[j] == '=' || (c == '<' && (frag[j] == '>' || frag[j] == '@'))) {
				j++
			} else if c == '!' {
				return bad("unexpected '!'")
			}
			i = j
		case c == '-':
			// -> and ->> only; "--" comments and arithmetic are rejected.
			if i+1 < len(frag) && frag[i+1] == '>' {
				i += 2
				if i < len(frag) && frag[i] == '>' {
					i++
				}
				continue
			}
			return bad("unexpected '-'")
		case c == '@':
			if i+1 < len(frag) && frag[i+1] == '>' {
				i += 2
				continue
			}
			return bad("unexpected '@'")
		default:
			return bad("character " + strconv.QuoteRune(rune(c)) + " is not allowed")
		}
	}
	if depth != 0 {
		return bad("unbalanced parentheses")
	}
	return nil
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
