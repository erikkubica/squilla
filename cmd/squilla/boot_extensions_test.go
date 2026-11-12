package main

import (
	"errors"
	"testing"

	"squilla/internal/models"
)

func TestMigrateBootExtensions_DropsFailedMigrations(t *testing.T) {
	exts := []models.Extension{{Slug: "a"}, {Slug: "broken"}, {Slug: "c"}}
	var ran []string
	got := migrateBootExtensions(exts, func(e models.Extension) error {
		ran = append(ran, e.Slug)
		if e.Slug == "broken" {
			return errors.New("syntax error")
		}
		return nil
	})
	if len(ran) != 3 {
		t.Fatalf("every extension must be migrated, ran %v", ran)
	}
	if len(got) != 2 || got[0].Slug != "a" || got[1].Slug != "c" {
		t.Fatalf("extension with failed migrations must not be loaded, got %+v", got)
	}
}
