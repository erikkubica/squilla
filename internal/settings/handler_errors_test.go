package settings

import (
	"errors"
	"fmt"
	"testing"
)

func TestSaveValidationMessage(t *testing.T) {
	cases := []struct {
		err  error
		show bool
	}{
		{fmt.Errorf("settings: %q: unknown field %q", "site.general", "x"), true},
		{fmt.Errorf("settings: %q: failed to look up node %q: %w", "home", "1", errors.New(`pq: relation "content_nodes" does not exist`)), false},
		{errors.New(`ERROR: duplicate key value violates unique constraint "site_settings_pkey" (SQLSTATE 23505)`), false},
		{fmt.Errorf("encrypt %q: %w", "k", errors.New("cipher: boom")), false},
	}
	for _, tc := range cases {
		msg, ok := saveValidationMessage(tc.err)
		if ok != tc.show {
			t.Errorf("%v: show=%v, want %v", tc.err, ok, tc.show)
		}
		if !tc.show && msg != "" {
			t.Errorf("%v: leaked %q", tc.err, msg)
		}
	}
}
