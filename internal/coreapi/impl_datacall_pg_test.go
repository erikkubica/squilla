package coreapi

import (
	"context"
	"os"
	"testing"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// TestDataCall_Postgres exercises DataCall against a real database. It
// is opt-in: set SQUILLA_TEST_DATABASE_URL to a disposable Postgres DSN.
// The test creates and drops its own function.
func TestDataCall_Postgres(t *testing.T) {
	dsn := os.Getenv("SQUILLA_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("SQUILLA_TEST_DATABASE_URL not set")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	const fn = "squilla_datacall_test_fn"
	if err := db.Exec(`CREATE OR REPLACE FUNCTION ` + fn + `(p_n bigint, p_label text, p_meta jsonb)
RETURNS TABLE(n bigint, label text, meta jsonb, ratio double precision, ok boolean)
LANGUAGE sql AS $$ SELECT g, p_label, p_meta, g / 2.0, g % 2 = 0 FROM generate_series(1, p_n) g $$`).Error; err != nil {
		t.Fatalf("create function: %v", err)
	}
	t.Cleanup(func() { db.Exec(`DROP FUNCTION IF EXISTS ` + fn + `(bigint, text, jsonb)`) })

	api := &coreImpl{db: db}
	ctx := WithCaller(context.Background(), InternalCaller())
	rows, err := api.DataCall(ctx, fn, int64(2), "x", map[string]any{"k": "v"})
	if err != nil {
		t.Fatalf("DataCall: %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("got %d rows", len(rows))
	}
	r := rows[1]
	if r["n"] != int64(2) || r["label"] != "x" || r["ratio"] != 1.0 || r["ok"] != true {
		t.Fatalf("unexpected row %#v", r)
	}
	if m, ok := r["meta"].(map[string]any); !ok || m["k"] != "v" {
		t.Fatalf("jsonb not parsed: %#v", r["meta"])
	}

	// A name colliding with a pg_catalog built-in must not resolve to the
	// built-in (query_to_xml runs arbitrary SQL).
	if _, err := api.DataCall(ctx, "query_to_xml", "select 1", true, false, ""); err == nil {
		t.Fatal("query_to_xml resolved to the pg_catalog built-in")
	}

	empty, err := api.DataCall(ctx, fn, int64(0), "x", nil)
	if err != nil || empty == nil || len(empty) != 0 {
		t.Fatalf("empty result: rows=%#v err=%v", empty, err)
	}
}
