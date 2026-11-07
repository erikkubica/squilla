package main

import (
	"reflect"
	"strings"
	"testing"
)

// Notifications as the admin editor saves them (NotificationsTab.tsx):
// recipients templates, recipient_field, cc/bcc/reply_to, no legacy `to`.

func editorForm(notifs ...map[string]any) map[string]any {
	list := make([]any, len(notifs))
	for i, n := range notifs {
		list[i] = n
	}
	return map[string]any{"id": float64(7), "name": "Booking", "slug": "booking", "fields": []any{}, "notifications": list}
}

func TestEditorNotification_SiteEmailAndReplyToGuest(t *testing.T) {
	h := NewFakeHost()
	h.Settings["email"] = "team@site.test"
	h.Settings["site_name"] = "Site"
	p := newPlugin(h)

	p.triggerNotifications(editorForm(map[string]any{
		"enabled": true, "type": "admin", "recipients": "{{.site_email}}",
		"reply_to": "{{.field.email}}", "cc": "boss@site.test, team@site.test", "bcc": "archive@site.test",
		"subject": "New booking from {{.field.name}} on {{.site.name}}", "body": "<p>{{.field.name}}</p>",
	}), map[string]any{"name": "Sarah", "email": "sarah@guest.test"})

	if len(h.Sent) != 1 {
		t.Fatalf("want 1 email, got %d", len(h.Sent))
	}
	m := h.Sent[0]
	if !reflect.DeepEqual(m.To, []string{"team@site.test"}) {
		t.Errorf("to = %v", m.To)
	}
	if m.ReplyTo != "sarah@guest.test" {
		t.Errorf("reply_to = %q", m.ReplyTo)
	}
	if !reflect.DeepEqual(m.CC, []string{"boss@site.test"}) { // the To address is not repeated in Cc
		t.Errorf("cc = %v", m.CC)
	}
	if !reflect.DeepEqual(m.BCC, []string{"archive@site.test"}) {
		t.Errorf("bcc = %v", m.BCC)
	}
	if m.Subject != "New booking from Sarah on Site" {
		t.Errorf("subject = %q", m.Subject)
	}
}

func TestEditorNotification_AutoResponderGoesToTheGuest(t *testing.T) {
	h := NewFakeHost()
	p := newPlugin(h)
	p.triggerNotifications(editorForm(map[string]any{
		"enabled": true, "type": "auto-responder", "recipient_field": "email", "recipients": "{{.field.email}}",
		"subject": "We got it", "body": "<p>Thanks</p>",
	}), map[string]any{"email": "Sarah <sarah@guest.test>"})
	if len(h.Sent) != 1 || !reflect.DeepEqual(h.Sent[0].To, []string{"sarah@guest.test"}) {
		t.Fatalf("auto-responder: %+v", h.Sent)
	}
}

func TestEditorNotification_RecipientFieldWithoutRecipients(t *testing.T) {
	h := NewFakeHost()
	p := newPlugin(h)
	p.triggerNotifications(editorForm(map[string]any{
		"enabled": true, "recipient_field": "email", "subject": "x", "body": "x",
	}), map[string]any{"email": "guest@guest.test"})
	if len(h.Sent) != 1 || h.Sent[0].To[0] != "guest@guest.test" {
		t.Fatalf("recipient_field fallback: %+v", h.Sent)
	}
}

func TestEditorNotification_InvalidGuestAddressIsNotSent(t *testing.T) {
	h := NewFakeHost()
	p := newPlugin(h)
	p.triggerNotifications(editorForm(map[string]any{
		"enabled": true, "recipients": "{{.field.email}}", "subject": "x", "body": "x",
	}), map[string]any{"email": "not an email"})
	if len(h.Sent) != 0 {
		t.Fatalf("sent to an invalid address: %+v", h.Sent)
	}
}

func TestEditorNotification_WrappedInDefaultLayout(t *testing.T) {
	h := NewFakeHost()
	var asked []string
	h.CollectStub = func(action string, payload map[string]any) []string {
		asked = append(asked, action)
		if action != "email:wrap_layout" {
			return nil
		}
		return []string{"<html><body><h1>Site</h1>" + payload["html"].(string) + "</body></html>"}
	}
	p := newPlugin(h)
	p.triggerNotifications(editorForm(
		map[string]any{"enabled": true, "to": "a@site.test", "subject": "x", "body": "<p>{{.field.name}} &amp; co</p>"},
		map[string]any{"enabled": true, "to": "b@site.test", "subject": "y", "body": "<!DOCTYPE html><html><body>own</body></html>"},
	), map[string]any{"name": "Sarah"})
	if len(h.Sent) != 2 {
		t.Fatalf("want 2, got %d", len(h.Sent))
	}
	if got := h.Sent[0].HTML; got != "<html><body><h1>Site</h1><p>Sarah &amp; co</p></body></html>" {
		t.Errorf("not wrapped: %q", got)
	}
	if got := h.Sent[1].HTML; strings.Contains(got, "<h1>") {
		t.Errorf("a full document was wrapped again: %q", got)
	}
	if len(asked) != 1 {
		t.Errorf("want one layout request (none for the full document), got %v", asked)
	}
}

func TestEditorNotification_NoLayoutKeepsBody(t *testing.T) {
	h := NewFakeHost() // no email-manager answering
	p := newPlugin(h)
	p.triggerNotifications(editorForm(map[string]any{"enabled": true, "to": "a@site.test", "subject": "x", "body": "<p>hi</p>"}), map[string]any{})
	if len(h.Sent) != 1 || h.Sent[0].HTML != "<p>hi</p>" {
		t.Fatalf("fallback: %+v", h.Sent)
	}
}
