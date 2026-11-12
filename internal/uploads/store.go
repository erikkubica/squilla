package uploads

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gorm.io/gorm"
)

// Sentinel errors for predictable handling at the HTTP and MCP layers.
var (
	ErrNotFound         = errors.New("upload token not found")
	ErrExpired          = errors.New("upload token expired")
	ErrAlreadyUploaded  = errors.New("upload already uploaded")
	ErrAlreadyFinalized = errors.New("upload already finalized")
	ErrKindMismatch     = errors.New("upload kind mismatch")
	ErrSHA256Mismatch   = errors.New("sha256 mismatch")
	ErrInvalidKind      = errors.New("invalid upload kind")
	ErrSizeExceedsCap   = errors.New("upload exceeds max_bytes")
	ErrNotUploaded      = errors.New("upload not yet uploaded")
	ErrFinalizing       = errors.New("upload is already being finalized")
	ErrWrongUser        = errors.New("upload token was issued to a different user")
)

// finalizedRetention is how long finalized rows are kept (as a short audit
// trail) before Cleanup purges them.
const finalizedRetention = 24 * time.Hour

// finalizingGrace is how long past expires_at a row stuck in "finalizing"
// (process crashed mid-install) survives before Cleanup reclaims it. Long
// enough that a slow install still running past the TTL keeps its bytes.
const finalizingGrace = time.Hour

// hashToken returns the storage key for a raw upload token. Only the hash
// is persisted, so a database read (backup, SQL console, a data-API leak)
// does not yield usable upload tokens.
func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

// validTokenFormat reports whether raw has the shape newToken produces
// (64 lower-case hex chars). Rejecting anything else up front keeps path
// separators and other junk out of every code path.
func validTokenFormat(raw string) bool {
	if len(raw) != 64 {
		return false
	}
	for i := 0; i < len(raw); i++ {
		c := raw[i]
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
			return false
		}
	}
	return true
}

// IssueOptions describes a new upload row about to be issued. UserID and Kind
// are mandatory; everything else is metadata the finalize step may use.
type IssueOptions struct {
	Kind     Kind
	UserID   int64
	Filename string
	MimeType string
	MaxBytes int64
	TTL      time.Duration
}

// Store wraps the pending_uploads table and the on-disk staging directory
// (data/pending/<sha256(token)>.bin). All flows run through a Store so the SQL state
// machine stays the single source of truth for what's allowed when.
type Store struct {
	db      *gorm.DB
	tempDir string
	now     func() time.Time
}

// NewStore constructs a Store. tempDir is created if it does not exist —
// callers don't need to mkdir before constructing.
func NewStore(db *gorm.DB, tempDir string) (*Store, error) {
	if tempDir == "" {
		tempDir = "data/pending"
	}
	if err := os.MkdirAll(tempDir, 0o755); err != nil {
		return nil, fmt.Errorf("create pending dir: %w", err)
	}
	// Best-effort schema sync for SQLite-backed tests; production runs the
	// SQL migration. AutoMigrate is idempotent and matches columns to tags.
	if err := db.AutoMigrate(&PendingUpload{}); err != nil {
		return nil, fmt.Errorf("migrate pending_uploads: %w", err)
	}
	return &Store{db: db, tempDir: tempDir, now: time.Now}, nil
}

// SetClock overrides the clock for tests (cleanup, expiry).
func (s *Store) SetClock(now func() time.Time) { s.now = now }

// TempDir is the on-disk staging directory.
func (s *Store) TempDir() string { return s.tempDir }

// Issue allocates a new pending row with a fresh token and returns it.
func (s *Store) Issue(opts IssueOptions) (*PendingUpload, error) {
	if !opts.Kind.Valid() {
		return nil, ErrInvalidKind
	}
	if opts.MaxBytes <= 0 {
		return nil, fmt.Errorf("max_bytes must be positive")
	}
	if opts.TTL <= 0 {
		opts.TTL = 15 * time.Minute
	}
	tok, err := newToken()
	if err != nil {
		return nil, fmt.Errorf("token: %w", err)
	}
	row := &PendingUpload{
		Token:     hashToken(tok),
		Kind:      string(opts.Kind),
		UserID:    opts.UserID,
		Filename:  opts.Filename,
		MimeType:  opts.MimeType,
		MaxBytes:  opts.MaxBytes,
		State:     string(StatePending),
		ExpiresAt: s.now().Add(opts.TTL),
	}
	if err := s.db.Create(row).Error; err != nil {
		return nil, fmt.Errorf("insert pending_upload: %w", err)
	}
	// The DB holds only the hash; hand the raw token back to the caller
	// exactly once so it can be embedded in the upload URL.
	row.Token = tok
	return row, nil
}

// Lookup fetches a row by raw token. ErrNotFound when missing or when the
// token is not well-formed. The returned row's Token field holds the
// stored hash, not the raw token.
func (s *Store) Lookup(token string) (*PendingUpload, error) {
	if !validTokenFormat(token) {
		return nil, ErrNotFound
	}
	var row PendingUpload
	if err := s.db.Where("token = ?", hashToken(token)).First(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &row, nil
}

// ValidateForPUT checks a row is usable for a fresh PUT: not expired, still
// in 'pending' state. Single-use semantics — a second PUT to the same token
// returns ErrAlreadyUploaded.
func (s *Store) ValidateForPUT(row *PendingUpload) error {
	if row.State == string(StateFinalized) {
		return ErrAlreadyFinalized
	}
	if row.State == string(StateUploaded) || row.State == string(StateFinalizing) {
		return ErrAlreadyUploaded
	}
	if s.now().After(row.ExpiresAt) {
		return ErrExpired
	}
	return nil
}

// MarkUploaded transitions pending → uploaded after the temp file has been
// fully written. Stores the size + sha256 + temp_path on the row so finalize
// can verify and locate the bytes.
//
// tempPath is recorded for operators only; every reader derives the path
// from the token via TempPathFor and never trusts the column.
func (s *Store) MarkUploaded(token string, size int64, sha string, tempPath string) error {
	if !validTokenFormat(token) {
		return ErrNotFound
	}
	res := s.db.Model(&PendingUpload{}).
		Where("token = ? AND state = ?", hashToken(token), string(StatePending)).
		Updates(map[string]interface{}{
			"state":      string(StateUploaded),
			"size_bytes": size,
			"sha256":     sha,
			"temp_path":  tempPath,
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		// Row was concurrently modified or no longer pending. Re-read so the
		// caller can return a precise error.
		row, err := s.Lookup(token)
		if err != nil {
			return err
		}
		return s.ValidateForPUT(row)
	}
	return nil
}

// ValidateForFinalize checks a row is ready to be finalized: kind matches,
// state == uploaded, not yet finalized, optional sha matches stored.
func (s *Store) ValidateForFinalize(row *PendingUpload, kind Kind, expectedSHA string) error {
	if row.Kind != string(kind) {
		return ErrKindMismatch
	}
	if row.State == string(StateFinalized) {
		return ErrAlreadyFinalized
	}
	if row.State == string(StateFinalizing) {
		return ErrFinalizing
	}
	if row.State != string(StateUploaded) {
		return ErrNotUploaded
	}
	if s.now().After(row.ExpiresAt) {
		return ErrExpired
	}
	if expectedSHA != "" && row.SHA256 != nil && *row.SHA256 != expectedSHA {
		return ErrSHA256Mismatch
	}
	return nil
}

// Claim validates a finalize request and atomically moves the row from
// uploaded → finalizing, so two concurrent finalize calls cannot both
// install the same bytes. userID must match the user the token was issued
// to. On success the caller must end with MarkFinalized (success) or
// Release (failure, so the client may retry).
func (s *Store) Claim(token string, kind Kind, expectedSHA string, userID int64) (*PendingUpload, error) {
	row, err := s.Lookup(token)
	if err != nil {
		return nil, err
	}
	if row.UserID != userID {
		return nil, ErrWrongUser
	}
	if err := s.ValidateForFinalize(row, kind, expectedSHA); err != nil {
		return nil, err
	}
	res := s.db.Model(&PendingUpload{}).
		Where("token = ? AND state = ?", row.Token, string(StateUploaded)).
		Update("state", string(StateFinalizing))
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		// Lost the race to a concurrent finalize.
		return nil, ErrFinalizing
	}
	row.State = string(StateFinalizing)
	return row, nil
}

// Release returns a claimed row to uploaded after a failed install so the
// client can retry before the token expires.
func (s *Store) Release(token string) error {
	if !validTokenFormat(token) {
		return ErrNotFound
	}
	return s.db.Model(&PendingUpload{}).
		Where("token = ? AND state = ?", hashToken(token), string(StateFinalizing)).
		Update("state", string(StateUploaded)).Error
}

// OpenUpload opens the staged bytes for token. The path is always derived
// from the token (TempPathFor), never read from the database row.
func (s *Store) OpenUpload(token string) (*os.File, error) {
	if !validTokenFormat(token) {
		return nil, ErrNotFound
	}
	return os.Open(s.TempPathFor(token))
}

// MarkFinalized transitions uploaded|finalizing → finalized and removes
// the temp file (derived from the token, never from the temp_path column).
func (s *Store) MarkFinalized(token string) error {
	if !validTokenFormat(token) {
		return ErrNotFound
	}
	now := s.now()
	res := s.db.Model(&PendingUpload{}).
		Where("token = ? AND state IN ?", hashToken(token), []string{string(StateUploaded), string(StateFinalizing)}).
		Updates(map[string]interface{}{
			"state":        string(StateFinalized),
			"finalized_at": &now,
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		if _, err := s.Lookup(token); err != nil {
			return err
		}
		// Someone else finalized this token first.
		return ErrAlreadyFinalized
	}
	_ = os.Remove(s.TempPathFor(token))
	return nil
}

// TempPathFor returns the canonical on-disk path for a given raw token.
// Server-controlled — clients never name the file. The file is named after
// the token hash, so the staging directory listing does not leak tokens.
func (s *Store) TempPathFor(token string) string {
	return s.pathForKey(hashToken(token))
}

// pathForKey maps a stored token hash to its staging file.
func (s *Store) pathForKey(key string) string {
	return filepath.Join(s.tempDir, filepath.Base(key)+".bin")
}

// Cleanup deletes rows that are no longer useful and removes their temp
// files: pending/uploaded rows past expires_at, rows stuck in finalizing
// for finalizingGrace past expiry, and finalized rows older than
// finalizedRetention. Temp paths are derived from the stored token hash,
// never from the temp_path column. Idempotent — safe to call from a
// background ticker. Returns the number of rows removed.
func (s *Store) Cleanup() (int, error) {
	now := s.now()
	var rows []PendingUpload
	if err := s.db.Where(
		"(state IN ? AND expires_at < ?) OR (state = ? AND expires_at < ?) OR (state = ? AND finalized_at < ?)",
		[]string{string(StatePending), string(StateUploaded)}, now,
		string(StateFinalizing), now.Add(-finalizingGrace),
		string(StateFinalized), now.Add(-finalizedRetention),
	).Find(&rows).Error; err != nil {
		return 0, fmt.Errorf("query expired uploads: %w", err)
	}
	if len(rows) == 0 {
		return 0, nil
	}
	keys := make([]string, 0, len(rows))
	for _, r := range rows {
		_ = os.Remove(s.pathForKey(r.Token))
		keys = append(keys, r.Token)
	}
	if err := s.db.Where("token IN ?", keys).Delete(&PendingUpload{}).Error; err != nil {
		return 0, fmt.Errorf("delete expired uploads: %w", err)
	}
	return len(rows), nil
}
