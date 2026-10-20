package menuloc

import (
	"testing"

	"squilla/internal/models"
	"squilla/internal/testutil"
)

func TestAssignmentsPreferAdminChoiceOverSeededDefault(t *testing.T) {
	db := testutil.NewSQLiteDB(t)
	if err := db.AutoMigrate(&models.SiteSetting{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	SetActive([]Def{{Slug: "primary"}, {Slug: "footer-1", Label: "Footer 1"}})

	// A theme seed writes through settings.set, i.e. at the default language.
	seeded := "main-nav"
	db.Create(&models.SiteSetting{Key: settingPrefix + "primary", LanguageCode: "en", Value: &seeded})
	if got := LoadAssignments(db)["primary"]; got != "main-nav" {
		t.Fatalf("seeded default not read: %q", got)
	}

	// The admin reassigns: replaces the seeded row.
	if err := Assign(db, "primary", "other-nav"); err != nil {
		t.Fatal(err)
	}
	if got := LoadAssignments(db)["primary"]; got != "other-nav" {
		t.Fatalf("admin assignment lost: %q", got)
	}

	// Clearing sticks even if a seed writes its default again afterwards.
	if err := Assign(db, "primary", ""); err != nil {
		t.Fatal(err)
	}
	db.Create(&models.SiteSetting{Key: settingPrefix + "primary", LanguageCode: "en", Value: &seeded})
	if got, ok := LoadAssignments(db)["primary"]; ok {
		t.Fatalf("cleared location came back as %q", got)
	}

	if !Declared("footer-1") || Declared("nope") {
		t.Fatal("Declared mismatch")
	}
	if List()[0].Label != "primary" {
		t.Fatal("missing label should default to slug")
	}
}
