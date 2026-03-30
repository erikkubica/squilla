package db

import (
	"embed"
	"fmt"
	"log"
	"sort"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Connect establishes a connection to the PostgreSQL database using GORM.
// Per architecture convention, database connectivity failures trigger a fatal halt.
func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get underlying sql.DB: %v", err)
		return nil, err
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(1 * time.Hour)

	// Verify connectivity
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
		return nil, err
	}

	return db, nil
}

// RunMigrations reads and executes SQL migration files from the embedded
// migrations directory in lexicographic order, skipping already-applied migrations.
func RunMigrations(db *gorm.DB) error {
	// Ensure the schema_migrations tracking table exists.
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		filename VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMP NOT NULL DEFAULT NOW()
	)`).Error; err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// Load already-applied migrations.
	var applied []struct{ Filename string }
	db.Raw("SELECT filename FROM schema_migrations").Scan(&applied)
	appliedSet := make(map[string]bool, len(applied))
	for _, a := range applied {
		appliedSet[a.Filename] = true
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Sort entries by name to ensure deterministic execution order.
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		if appliedSet[entry.Name()] {
			continue
		}

		content, err := migrationsFS.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", entry.Name(), err)
		}

		if txErr := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Exec(string(content)).Error; err != nil {
				return err
			}
			if err := tx.Exec("INSERT INTO schema_migrations (filename) VALUES (?)", entry.Name()).Error; err != nil {
				return err
			}
			return nil
		}); txErr != nil {
			return fmt.Errorf("failed to execute migration %s: %w", entry.Name(), txErr)
		}
		log.Printf("migration applied: %s", entry.Name())
	}

	return nil
}
