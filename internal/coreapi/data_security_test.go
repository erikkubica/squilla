package coreapi

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"

	"squilla/internal/testutil"
)

func TestIsValidOrderBy(t *testing.T) {
	good := []string{
		"created_at DESC",
		"created_at desc",
		"title ASC",
		"id",
		`"created_at" DESC`,
		"col1 ASC, col2 DESC",
		"COALESCE(published_at, created_at) DESC",
		"coalesce(published_at,created_at) desc nulls last",
		"published_at DESC NULLS FIRST, id ASC",
	}
	for _, s := range good {
		if !isValidOrderBy(s) {
			t.Errorf("isValidOrderBy(%q) = false, want true", s)
		}
	}
	bad := []string{
		"",
		"(SELECT 1)",
		"created_at; DROP TABLE users",
		"created_at DESC; --",
		"created_at -- comment",
		"created_at /* x */",
		"lower(title)",
		"pg_sleep(5)",
		"CASE WHEN (SELECT 1)=1 THEN id ELSE title END",
		"COALESCE((SELECT password_hash FROM users LIMIT 1), title)",
		"COALESCE(a, lower(b))",
		"COALESCE()",
		"id ASC,",
		"id sideways",
		"users.id",
		"id::text",
		`"a""b"`,
		"ASC",
		"id NULLS",
		"title COLLATE \"C\"",
	}
	for _, s := range bad {
		if isValidOrderBy(s) {
			t.Errorf("isValidOrderBy(%q) = true, want false", s)
		}
	}
}

func TestValidateRawWhere_AcceptsBundledExtensionFragments(t *testing.T) {
	// Every Raw fragment shape the bundled extensions (email-manager,
	// forms, media-manager) build today, plus a few common forms.
	good := []string{
		"action = ? AND enabled = ?",
		"action = ? AND enabled = ? AND (node_type IS NULL OR node_type = ?)",
		"slug = ? AND language_id = ?",
		"slug = ? AND language_id IS NULL",
		"language_id IS NULL",
		"code = ?",
		"name ILIKE ?",
		"(name ILIKE ? OR slug ILIKE ? OR subject_template ILIKE ?)",
		"action = ? AND recipient_email ILIKE ? AND created_at >= ? AND created_at < ? AND status = ?",
		"form_id = ? AND created_at >= ? AND created_at < ? AND data::text ILIKE ? AND status = ?",
		"created_at < ?",
		"mime_type LIKE ? AND (is_optimized IS NULL OR is_optimized = false)",
		"is_optimized = ? AND original_path != ?",
		"mime_type LIKE ? AND mime_type != ?",
		"mime_type LIKE ? AND original_name ILIKE ?",
		"status = 'active' AND count >= 3",
		"lower(email) = lower(?)",
		"coalesce(updated_at, created_at) < now()",
		"id IN (?, ?, ?)",
		"NOT (archived = true)",
		"data->>'kind' = ?",
		"tags @> ?::jsonb",
		"note = 'it''s fine'",
		"note = 'select * from users'", // keywords inside literals are data
	}
	for _, s := range good {
		if err := ValidateRawWhere(s); err != nil {
			t.Errorf("ValidateRawWhere(%q) = %v, want nil", s, err)
		}
	}
}

func TestValidateRawWhere_RejectsInjection(t *testing.T) {
	bad := []string{
		"1=1; DROP TABLE users",
		"id = ? OR (SELECT count(*) FROM users) > 0",
		"id IN (SELECT id FROM users)",
		"id = ? UNION SELECT password_hash FROM users",
		"id = ? -- trailing comment",
		"id = ? /* comment */",
		"EXISTS (TABLE users)",
		"id = (VALUES (1))",
		"pg_sleep(5) IS NULL",
		"length(pg_read_file('/etc/passwd')) > 0",
		"current_setting('x') = ?",
		"version() = ?",
		"users.id = ?",
		"public.users IS NULL",
		"note = E'\\' OR 1=1 --'",
		"note = $$x$$",
		`"password_hash" = ?`,
		"id = 1 + 1",
		"note = 'unterminated",
		"(id = ?",
		"id = ?)",
		"note || 'x' = ?",
		"id = ?::regclass",
		"CASE WHEN id = 1 THEN true END",
		"WITH x AS (SELECT 1) SELECT 1",
		strings.Repeat("a = ? AND ", 300) + "b = ?",
	}
	for _, s := range bad {
		if err := ValidateRawWhere(s); err == nil {
			t.Errorf("ValidateRawWhere(%q) = nil, want rejection", s)
		} else if !errors.Is(err, ErrValidation) {
			t.Errorf("ValidateRawWhere(%q) error %v is not a validation error", s, err)
		}
	}
}

func newDataTestImpl(t *testing.T) *coreImpl {
	t.Helper()
	db := testutil.NewSQLiteDB(t)
	if err := db.Exec("CREATE TABLE widgets (id INTEGER PRIMARY KEY, name TEXT)").Error; err != nil {
		t.Fatal(err)
	}
	if err := db.Exec("INSERT INTO widgets (id, name) VALUES (1, 'a'), (2, 'b')").Error; err != nil {
		t.Fatal(err)
	}
	return &coreImpl{db: db}
}

func TestDataQuery_RawValidatedForNonInternalCallers(t *testing.T) {
	c := newDataTestImpl(t)
	ext := WithCaller(context.Background(), CallerInfo{
		Slug: "evil", Type: "grpc", OwnedTables: map[string]bool{"widgets": true},
	})
	_, err := c.DataQuery(ext, "widgets", DataStoreQuery{
		Raw: "id = 1 OR (SELECT count(*) FROM sqlite_master) > 0",
	})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("sub-select via Raw for extension caller: err = %v, want validation error", err)
	}

	res, err := c.DataQuery(ext, "widgets", DataStoreQuery{Raw: "name = ?", Args: []any{"b"}})
	if err != nil {
		t.Fatalf("legit Raw for extension caller: %v", err)
	}
	if res.Total != 1 {
		t.Fatalf("legit Raw total = %d, want 1", res.Total)
	}
}

func TestDataQuery_RejectsBadOrderBy(t *testing.T) {
	c := newDataTestImpl(t)
	ctx := WithCaller(context.Background(), InternalCaller())
	if _, err := c.DataQuery(ctx, "widgets", DataStoreQuery{OrderBy: "(SELECT 1)"}); !errors.Is(err, ErrValidation) {
		t.Fatalf("err = %v, want validation error", err)
	}
	if _, err := c.DataQuery(ctx, "widgets", DataStoreQuery{OrderBy: "name DESC, id ASC"}); err != nil {
		t.Fatalf("legit order_by: %v", err)
	}
}

func TestDataMethods_DoNotEchoDriverErrors(t *testing.T) {
	c := newDataTestImpl(t)
	ctx := WithCaller(context.Background(), InternalCaller())
	checks := map[string]error{}
	_, checks["get"] = c.DataGet(ctx, "no_such_table", 1)
	_, checks["query"] = c.DataQuery(ctx, "no_such_table", DataStoreQuery{})
	_, checks["create"] = c.DataCreate(ctx, "widgets", map[string]any{"no_such_column": 1})
	checks["update"] = c.DataUpdate(ctx, "widgets", 1, map[string]any{"no_such_column": 1})
	checks["delete"] = c.DataDelete(ctx, "no_such_table", 1)
	for op, err := range checks {
		if err == nil {
			t.Errorf("%s: expected an error", op)
			continue
		}
		if !errors.Is(err, ErrInternal) {
			t.Errorf("%s: err %v is not ErrInternal", op, err)
		}
		msg := strings.ToLower(err.Error())
		if strings.Contains(msg, "no such") || strings.Contains(msg, "no_such") || strings.Contains(msg, "sql") {
			t.Errorf("%s: driver detail leaked: %q", op, err.Error())
		}
	}
}

func TestQueryNodes_RejectsUnsafeOrderBy(t *testing.T) {
	c := &coreImpl{db: testutil.NewSQLiteDB(t)}
	ctx := WithCaller(context.Background(), InternalCaller())
	for _, ob := range []string{
		"(CASE WHEN (SELECT 1)=1 THEN id ELSE title END)",
		"created_at; DELETE FROM users",
		"pg_sleep(1)",
		"lower(title)",
	} {
		if _, err := c.QueryNodes(ctx, NodeQuery{OrderBy: ob}); !errors.Is(err, ErrValidation) {
			t.Errorf("QueryNodes(order_by=%q) err = %v, want validation error", ob, err)
		}
	}
}

func TestKernelPrivateTables_IncludeUploadAndMigrationState(t *testing.T) {
	for _, tab := range []string{"pending_uploads", "extension_migrations"} {
		if !IsKernelPrivateTable(tab) {
			t.Errorf("%s must be kernel-private", tab)
		}
	}
}

// grpcError keeps classified messages (validation, not-found, capability)
// but never forwards an unclassified error's text — wrapped driver errors
// carry SQL, table and column names.
func TestGRPCError_HidesUnclassifiedDetail(t *testing.T) {
	cases := []struct {
		err      error
		code     codes.Code
		wantMsg  string
		mustHide string
	}{
		{NewValidation("title is required"), codes.InvalidArgument, "title is required", ""},
		{NewNotFound("node", 7), codes.NotFound, "node 7 not found", ""},
		{NewCapabilityDenied("nodes:write"), codes.PermissionDenied, "missing capability: nodes:write", ""},
		{fmt.Errorf("coreapi GetNode: %w", gorm.ErrRecordNotFound), codes.NotFound, "not found", "GetNode"},
		{fmt.Errorf("coreapi X: %w", errors.New(`pq: relation "secret_table" does not exist`)), codes.Internal, "internal error", "secret_table"},
	}
	for _, tc := range cases {
		st, _ := status.FromError(grpcError(tc.err))
		if st.Code() != tc.code || st.Message() != tc.wantMsg {
			t.Errorf("grpcError(%v) = %v %q, want %v %q", tc.err, st.Code(), st.Message(), tc.code, tc.wantMsg)
		}
		if tc.mustHide != "" && strings.Contains(st.Message(), tc.mustHide) {
			t.Errorf("grpcError leaked %q: %q", tc.mustHide, st.Message())
		}
	}
}

func TestQueryNodes_DoesNotEchoDriverErrors(t *testing.T) {
	// No content_nodes table: the driver error must stay server-side.
	c := &coreImpl{db: testutil.NewSQLiteDB(t)}
	ctx := WithCaller(context.Background(), InternalCaller())
	_, err := c.QueryNodes(ctx, NodeQuery{})
	if err == nil || !errors.Is(err, ErrInternal) {
		t.Fatalf("err = %v, want ErrInternal", err)
	}
	if msg := strings.ToLower(err.Error()); strings.Contains(msg, "no such") || strings.Contains(msg, "content_nodes") {
		t.Fatalf("driver detail leaked: %q", err.Error())
	}
}
