package coreapi

import (
	"context"
	"fmt"
	"log"
	"sort"
	"strings"
)

func (c *coreImpl) Log(ctx context.Context, level, message string, fields map[string]any) error {
	caller := CallerFromContext(ctx)

	prefix := "[internal]"
	if caller.Slug != "" {
		prefix = fmt.Sprintf("[ext:%s]", caller.Slug)
	}

	var fieldParts []string
	if len(fields) > 0 {
		keys := make([]string, 0, len(fields))
		for k := range fields {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			fieldParts = append(fieldParts, fmt.Sprintf("%s=%v", k, fields[k]))
		}
	}

	msg := fmt.Sprintf("%s %s", prefix, message)
	if len(fieldParts) > 0 {
		msg += " " + strings.Join(fieldParts, " ")
	}

	switch strings.ToLower(level) {
	case "error":
		log.Printf("[ERROR] %s", msg)
	case "warn", "warning":
		log.Printf("[WARN]  %s", msg)
	case "debug":
		log.Printf("[DEBUG] %s", msg)
	default:
		log.Printf("[INFO]  %s", msg)
	}

	return nil
}
