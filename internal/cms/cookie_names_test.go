package cms

import (
	"reflect"
	"testing"
)

func TestOwnedCookieSet(t *testing.T) {
	ReserveCookieNames("analytics_session")
	got := ownedCookieSet("analytics", "observe_cookies", []string{
		"analytics_optout", "squilla_session", "Analytics_x", "analytics_session", "forms_token", "analytics_", "analytics_ok-1",
	})
	if !reflect.DeepEqual(got, []string{"analytics_optout"}) {
		t.Fatalf("got %v", got)
	}
}
