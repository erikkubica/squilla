package main

import (
	"reflect"
	"strings"
	"testing"
)

func TestPlanDeliveries_PrivatePerRecipientWithoutCc(t *testing.T) {
	got := planDeliveries([]string{"a@x.com", " b@x.com "}, nil, []string{""})
	if len(got) != 2 || got[0].toHeader != "a@x.com" || !reflect.DeepEqual(got[1].rcpts, []string{"b@x.com"}) {
		t.Fatalf("want one private message each, got %+v", got)
	}
}

func TestPlanDeliveries_SharedMessageWithCcAndBcc(t *testing.T) {
	got := planDeliveries([]string{"a@x.com"}, []string{"c@x.com"}, []string{"hidden@x.com"})
	if len(got) != 1 {
		t.Fatalf("want one shared message, got %d", len(got))
	}
	d := got[0]
	if d.toHeader != "a@x.com" || d.ccHeader != "c@x.com" {
		t.Fatalf("headers: %+v", d)
	}
	if !reflect.DeepEqual(d.rcpts, []string{"a@x.com", "c@x.com", "hidden@x.com"}) {
		t.Fatalf("rcpts: %v", d.rcpts)
	}
}

func TestBuildMessage_HeadersAndNoBcc(t *testing.T) {
	msg := buildMessage("Site <s@x.com>", "a@x.com", "c@x.com", "guest@x.com", "Hi", "<p>x</p>")
	head := strings.SplitN(msg, "\r\n\r\n", 2)[0]
	for _, want := range []string{"To: a@x.com", "Cc: c@x.com", "Reply-To: guest@x.com"} {
		if !strings.Contains(head, want) {
			t.Errorf("missing %q in %q", want, head)
		}
	}
	if strings.Contains(head, "hidden") || strings.Contains(head, "Bcc") {
		t.Errorf("bcc leaked into headers: %q", head)
	}
	if plain := buildMessage("s@x.com", "a@x.com", "", "", "Hi", "x"); strings.Contains(plain, "Cc:") || strings.Contains(plain, "Reply-To:") {
		t.Errorf("empty optional headers written: %q", plain)
	}
}

func TestHandleEvent_DeclinesOtherProvider(t *testing.T) {
	// No SMTP host configured: before routing this returned
	// "SMTP host is required" and failed every Resend send.
	resp, err := (&SMTPPlugin{}).HandleEvent("email.send",
		[]byte(`{"to":["a@x.com"],"subject":"Hi","settings":{"provider":"resend-provider"}}`))
	if err != nil || resp.Handled || resp.Error != "" {
		t.Fatalf("want not-handled without error, got %+v, %v", resp, err)
	}
}

func TestHandleEvent_SelectedProviderValidates(t *testing.T) {
	resp, _ := (&SMTPPlugin{}).HandleEvent("email.send",
		[]byte(`{"to":["a@x.com"],"subject":"Hi","settings":{"provider":"smtp-provider"}}`))
	if !resp.Handled || resp.Error == "" {
		t.Fatalf("selected SMTP without a host must report an error, got %+v", resp)
	}
}
