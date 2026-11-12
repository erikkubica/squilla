package db

import (
	"errors"
	"strings"
	"testing"

	"squilla/internal/testutil"

	"gorm.io/gorm"
)

// TestRunMigrations_FailsWhenAppliedListUnreadable guards against the old
// behaviour of ignoring the schema_migrations read error, which would have
// treated a transient failure as "nothing applied" and re-run every
// migration against a populated database.
func TestRunMigrations_FailsWhenAppliedListUnreadable(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	execCount := 0
	// Swallow every Exec (CREATE TABLE / migrations) so dialect differences
	// don't matter, and fail the SELECT of applied migrations.
	if err := db.Callback().Raw().Replace("gorm:raw", func(tx *gorm.DB) { execCount++ }); err != nil {
		t.Fatal(err)
	}
	if err := db.Callback().Row().Before("gorm:row").Register("test:fail_applied", func(tx *gorm.DB) {
		if strings.Contains(tx.Statement.SQL.String(), "schema_migrations") {
			_ = tx.AddError(errors.New("boom"))
		}
	}); err != nil {
		t.Fatal(err)
	}
	err := RunMigrations(db)
	if err == nil || !strings.Contains(err.Error(), "schema_migrations") {
		t.Fatalf("expected schema_migrations read error, got %v", err)
	}
	if execCount != 1 {
		t.Fatalf("expected only the CREATE TABLE exec before aborting, got %d execs", execCount)
	}
}
