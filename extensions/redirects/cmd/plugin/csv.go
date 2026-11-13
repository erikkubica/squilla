package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"

	pb "squilla/pkg/plugin/proto"
)

const maxImportRows = 5000

type importError struct {
	Line    int    `json:"line"`
	Message string `json:"message"`
}

// handleImport reads "source,target[,status_code[,match_type]]" rows. An
// optional header row is skipped; a tab or semicolon works as separator.
func (p *Plugin) handleImport(ctx context.Context, body []byte) *pb.PluginHTTPResponse {
	var in struct {
		CSV            string `json:"csv"`
		UpdateExisting bool   `json:"update_existing"`
	}
	if err := json.Unmarshal(body, &in); err != nil {
		return jsonError(400, "INVALID_JSON", "expected {csv, update_existing}")
	}
	text := strings.TrimSpace(strings.TrimPrefix(in.CSV, "\uFEFF"))
	if text == "" {
		return validationError(map[string]string{"csv": "nothing to import"})
	}
	reader := csv.NewReader(strings.NewReader(text))
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true
	reader.LazyQuotes = true
	first, _, _ := strings.Cut(text, "\n")
	switch {
	case strings.Contains(first, "\t"):
		reader.Comma = '\t'
	case !strings.Contains(first, ",") && strings.Contains(first, ";"):
		reader.Comma = ';'
	}

	p.writeMu.Lock()
	defer p.writeMu.Unlock()
	defer func() { _ = p.reloadRules(ctx) }()

	existing := map[string]Rule{}
	for _, r := range p.rules.Load().all {
		existing[sourceKey(r)] = r
	}
	var created, updated, skipped int
	errs := []importError{}
	fail := func(line int, msg string) {
		if len(errs) < 50 {
			errs = append(errs, importError{line, msg})
		}
		skipped++
	}

	for n := 0; ; n++ {
		rec, err := reader.Read()
		if err == io.EOF {
			break
		}
		line, _ := reader.FieldPos(0)
		if err != nil {
			fail(line, "could not parse this line")
			continue
		}
		if n >= maxImportRows {
			fail(line, fmt.Sprintf("import stops at %d rows; split the file", maxImportRows))
			break
		}
		for i := range rec {
			rec[i] = strings.TrimSpace(rec[i])
		}
		if len(rec) == 1 && rec[0] == "" {
			continue
		}
		if n == 0 && strings.EqualFold(rec[0], "source") {
			continue
		}
		rule := Rule{Source: rec[0], Enabled: true, KeepQuery: true}
		if len(rec) > 1 {
			rule.Target = rec[1]
		}
		if len(rec) > 2 && rec[2] != "" {
			code, err := strconv.Atoi(rec[2])
			if err != nil {
				fail(line, "status code is not a number")
				continue
			}
			rule.StatusCode = code
		}
		if len(rec) > 3 {
			rule.MatchType = strings.ToLower(rec[3])
		}
		if fields := rule.normalize(); len(fields) > 0 {
			for k, v := range fields {
				fail(line, k+": "+v)
				break
			}
			continue
		}
		key := sourceKey(rule)
		if old, dup := existing[key]; dup {
			if !in.UpdateExisting {
				skipped++
				continue
			}
			cols := map[string]any{"target": rule.Target, "status_code": rule.StatusCode}
			if err := p.updateRule(ctx, old.ID, cols); err != nil {
				return jsonError(500, "INTERNAL", err.Error())
			}
			updated++
			continue
		}
		if err := p.createRule(ctx, &rule); err != nil {
			return jsonError(500, "INTERNAL", err.Error())
		}
		existing[key] = rule
		created++
	}
	return jsonResponse(200, map[string]any{"created": created, "updated": updated, "skipped": skipped, "errors": errs})
}

// handleExport returns every rule as CSV in the column order import reads.
func (p *Plugin) handleExport() *pb.PluginHTTPResponse {
	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	_ = w.Write([]string{"source", "target", "status_code", "match_type", "enabled", "hits", "note"})
	all := p.rules.Load().all
	for i := len(all) - 1; i >= 0; i-- {
		r := p.withLiveHits(all[i])
		_ = w.Write([]string{
			spreadsheetSafe(r.Source), spreadsheetSafe(r.Target), strconv.Itoa(r.StatusCode), r.MatchType,
			strconv.FormatBool(r.Enabled), strconv.FormatInt(r.Hits, 10), spreadsheetSafe(r.Note),
		})
	}
	w.Flush()
	return &pb.PluginHTTPResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":        "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="redirects.csv"`,
			"Cache-Control":       "no-store",
		},
		Body: buf.Bytes(),
	}
}

// spreadsheetSafe stops a cell from being run as a formula when the export
// is opened in a spreadsheet. Paths and URLs never start with these.
func spreadsheetSafe(s string) string {
	if s != "" && strings.ContainsRune("=+-@", rune(s[0])) {
		return "'" + s
	}
	return s
}
