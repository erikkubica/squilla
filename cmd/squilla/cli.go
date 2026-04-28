package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"squilla/internal/cms"
	"squilla/internal/db"
	"squilla/internal/secrets"

	"gorm.io/gorm"
)

// This file owns the CLI subcommand handlers: genkey, verify-plugin,
// migrate, seed. Splitting them out of main keeps the bootstrap
// readable — every subcommand short-circuits the normal startup path
// before config is loaded (genkey, verify-plugin) or right after
// migrations finish (migrate, seed).

// handlePreConfigCLI runs subcommands that don't need config or DB.
// Returns true when a subcommand was handled (caller should exit).
func handlePreConfigCLI() bool {
	if len(os.Args) <= 1 {
		return false
	}
	switch os.Args[1] {
	case "genkey":
		// `squilla genkey` prints a fresh base64-encoded master key the
		// operator pastes into SQUILLA_SECRET_KEY before first boot.
		k, err := secrets.GenerateKey()
		if err != nil {
			log.Fatalf("genkey failed: %v", err)
		}
		fmt.Println(k)
		return true
	case "verify-plugin":
		// `squilla verify-plugin <slug> <binary-path>` prints the SHA-256
		// digest and the matching site_setting key the operator should
		// pin. Useful before promoting an extension to production: pin
		// the digest, then any future swapped binary fails to load.
		if len(os.Args) < 4 {
			log.Fatalf("usage: squilla verify-plugin <slug> <binary-path>")
		}
		digest, err := cms.HashPluginBinary(os.Args[3])
		if err != nil {
			log.Fatalf("verify-plugin: %v", err)
		}
		fmt.Printf("sha256:        %s\n", digest)
		fmt.Printf("setting key:   %s\n", cms.PluginPinSettingKey(os.Args[2], filepath.Base(os.Args[3])))
		fmt.Printf("setting value: %s\n", digest)
		return true
	}
	return false
}

// handlePostMigrationCLI runs subcommands that need the DB up but
// should exit before normal service initialization. Returns true when
// handled.
func handlePostMigrationCLI(database *gorm.DB) bool {
	if len(os.Args) <= 1 {
		return false
	}
	switch os.Args[1] {
	case "migrate":
		log.Println("migrations complete, exiting")
		return true
	case "seed":
		if err := db.Seed(database); err != nil {
			log.Fatalf("database seed failed: %v", err)
		}
		log.Println("database seeded, exiting")
		return true
	}
	return false
}
