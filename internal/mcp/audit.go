package mcp

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"time"

	"gorm.io/gorm"

	"vibecms/internal/models"
)

type auditEntry struct {
	tokenID    *int
	tool       string
	argsHash   string
	status     string // ok | error | denied
	errorCode  string
	durationMs int
}

// auditor buffers audit rows and flushes them off the request path.
type auditor struct {
	db *gorm.DB
	ch chan auditEntry
}

func newAuditor(db *gorm.DB) *auditor {
	a := &auditor{db: db, ch: make(chan auditEntry, 256)}
	go a.drain()
	return a
}

func (a *auditor) log(e auditEntry) {
	select {
	case a.ch <- e:
	default:
		// Audit channel full — drop to protect request path; log a warning.
		log.Printf("WARN: mcp audit channel full, dropping entry for tool=%s", e.tool)
	}
}

func (a *auditor) drain() {
	for e := range a.ch {
		row := &models.McpAuditLog{
			TokenID:    e.tokenID,
			Tool:       e.tool,
			ArgsHash:   e.argsHash,
			Status:     e.status,
			ErrorCode:  e.errorCode,
			DurationMs: e.durationMs,
		}
		if err := a.db.Create(row).Error; err != nil {
			log.Printf("WARN: mcp audit write failed: %v", err)
		}
	}
}

func hashArgs(args map[string]any) string {
	if args == nil {
		return ""
	}
	b, err := json.Marshal(args)
	if err != nil {
		return ""
	}
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

// sinceMs returns elapsed milliseconds since t.
func sinceMs(t time.Time) int {
	return int(time.Since(t) / time.Millisecond)
}
