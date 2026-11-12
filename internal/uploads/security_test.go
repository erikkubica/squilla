package uploads

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// uploadedRow issues a media token for user 1 and moves it to "uploaded"
// with real bytes on disk.
func uploadedRow(t *testing.T, store *Store, body []byte) string {
	t.Helper()
	row := issue(t, store, KindMedia, 1024)
	if err := os.WriteFile(store.TempPathFor(row.Token), body, 0o644); err != nil {
		t.Fatalf("write temp: %v", err)
	}
	if err := store.MarkUploaded(row.Token, int64(len(body)), sha256Hex(body), store.TempPathFor(row.Token)); err != nil {
		t.Fatalf("MarkUploaded: %v", err)
	}
	return row.Token
}

func TestTokenStoredOnlyAsHash(t *testing.T) {
	store, _ := newStore(t)
	row := issue(t, store, KindMedia, 100)

	var n int64
	store.db.Model(&PendingUpload{}).Where("token = ?", row.Token).Count(&n)
	if n != 0 {
		t.Fatal("raw upload token found in pending_uploads")
	}
	got, err := store.Lookup(row.Token)
	if err != nil {
		t.Fatalf("Lookup by raw token: %v", err)
	}
	if got.Token == row.Token {
		t.Fatal("row read back from DB carries the raw token")
	}
	if strings.Contains(store.TempPathFor(row.Token), row.Token) {
		t.Fatal("staging file name contains the raw token")
	}
}

func TestLookupRejectsMalformedTokens(t *testing.T) {
	store, _ := newStore(t)
	for _, tok := range []string{"", "../../etc/passwd", strings.Repeat("A", 64), strings.Repeat("a", 63), strings.Repeat("a", 62) + "/x"} {
		if _, err := store.Lookup(tok); !errors.Is(err, ErrNotFound) {
			t.Errorf("Lookup(%q) = %v, want ErrNotFound", tok, err)
		}
	}
}

// A forged temp_path (e.g. written through the data API) must never be
// opened or deleted: finalize and cleanup derive the path from the token.
func TestForgedTempPathIsIgnored(t *testing.T) {
	store, _ := newStore(t)
	victim := filepath.Join(t.TempDir(), "victim.txt")
	if err := os.WriteFile(victim, []byte("secret"), 0o644); err != nil {
		t.Fatal(err)
	}

	tok := uploadedRow(t, store, []byte("hello"))
	row, _ := store.Lookup(tok)
	store.db.Model(&PendingUpload{}).Where("token = ?", row.Token).Update("temp_path", victim)

	f, err := store.OpenUpload(tok)
	if err != nil {
		t.Fatalf("OpenUpload: %v", err)
	}
	data, _ := io.ReadAll(f)
	f.Close()
	if string(data) != "hello" {
		t.Fatalf("OpenUpload read %q, want the staged bytes", data)
	}
	if err := store.MarkFinalized(tok); err != nil {
		t.Fatalf("MarkFinalized: %v", err)
	}
	if _, err := os.Stat(victim); err != nil {
		t.Fatalf("MarkFinalized deleted the forged temp_path target: %v", err)
	}

	// Expired row with forged temp_path → Cleanup must not touch victim.
	base := time.Now()
	store.SetClock(func() time.Time { return base })
	tok2 := uploadedRow(t, store, []byte("x"))
	row2, _ := store.Lookup(tok2)
	store.db.Model(&PendingUpload{}).Where("token = ?", row2.Token).Update("temp_path", victim)
	store.SetClock(func() time.Time { return base.Add(time.Hour) })
	if _, err := store.Cleanup(); err != nil {
		t.Fatalf("Cleanup: %v", err)
	}
	if _, err := os.Stat(victim); err != nil {
		t.Fatalf("Cleanup deleted the forged temp_path target: %v", err)
	}
	if _, err := os.Stat(store.TempPathFor(tok2)); !os.IsNotExist(err) {
		t.Fatalf("Cleanup did not remove the real staging file: %v", err)
	}
}

func TestClaimRequiresIssuingUser(t *testing.T) {
	store, _ := newStore(t)
	tok := uploadedRow(t, store, []byte("hello"))
	if _, err := store.Claim(tok, KindMedia, "", 2); !errors.Is(err, ErrWrongUser) {
		t.Fatalf("Claim by other user = %v, want ErrWrongUser", err)
	}
	if _, err := store.Claim(tok, KindMedia, "", 1); err != nil {
		t.Fatalf("Claim by issuing user: %v", err)
	}
}

func TestClaimIsAtomic(t *testing.T) {
	store, _ := newStore(t)
	tok := uploadedRow(t, store, []byte("hello"))

	var wins int32
	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if _, err := store.Claim(tok, KindMedia, "", 1); err == nil {
				atomic.AddInt32(&wins, 1)
			}
		}()
	}
	wg.Wait()
	if wins != 1 {
		t.Fatalf("expected exactly one successful claim, got %d", wins)
	}
	// A second claim after the first is refused until released.
	if _, err := store.Claim(tok, KindMedia, "", 1); !errors.Is(err, ErrFinalizing) {
		t.Fatalf("re-claim = %v, want ErrFinalizing", err)
	}
	if err := store.Release(tok); err != nil {
		t.Fatalf("Release: %v", err)
	}
	if _, err := store.Claim(tok, KindMedia, "", 1); err != nil {
		t.Fatalf("claim after release: %v", err)
	}
	if err := store.MarkFinalized(tok); err != nil {
		t.Fatalf("MarkFinalized: %v", err)
	}
	if _, err := store.Claim(tok, KindMedia, "", 1); !errors.Is(err, ErrAlreadyFinalized) {
		t.Fatalf("claim after finalize = %v, want ErrAlreadyFinalized", err)
	}
}

func TestCleanupPurgesOldFinalizedRows(t *testing.T) {
	store, _ := newStore(t)
	base := time.Now()
	store.SetClock(func() time.Time { return base })
	tok := uploadedRow(t, store, []byte("x"))
	if err := store.MarkFinalized(tok); err != nil {
		t.Fatalf("MarkFinalized: %v", err)
	}
	store.SetClock(func() time.Time { return base.Add(finalizedRetention + time.Minute) })
	n, err := store.Cleanup()
	if err != nil {
		t.Fatalf("Cleanup: %v", err)
	}
	if n != 1 {
		t.Fatalf("expected finalized row purged, swept %d", n)
	}
	if _, err := store.Lookup(tok); !errors.Is(err, ErrNotFound) {
		t.Fatalf("finalized row still present: %v", err)
	}
}

// The PUT route is unauthenticated: a disk failure must not echo the
// absolute staging path back to the caller.
func TestPUTInternalErrorsAreGeneric(t *testing.T) {
	if os.Geteuid() == 0 {
		t.Skip("permission-based failure injection does not work as root")
	}
	store, dir := newStore(t)
	row := issue(t, store, KindMedia, 100)
	if err := os.Chmod(dir, 0o500); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chmod(dir, 0o755) })

	srv := httptest.NewServer(NewHandler(store))
	defer srv.Close()
	resp := putBytes(t, srv, row.Token, []byte("hi"))
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", resp.StatusCode)
	}
	body := decodeJSON(t, resp.Body)
	msg, _ := body["error"].(string)
	if strings.Contains(msg, dir) || strings.Contains(msg, "permission") {
		t.Fatalf("internal error leaked detail: %q", msg)
	}
}
