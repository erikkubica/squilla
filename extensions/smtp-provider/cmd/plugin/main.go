package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"

	goplugin "github.com/hashicorp/go-plugin"
	"google.golang.org/grpc"

	"squilla/internal/coreapi"
	vibeplugin "squilla/pkg/plugin"
	coreapipb "squilla/pkg/plugin/coreapipb"
	pb "squilla/pkg/plugin/proto"
)

// dialTimeout caps how long we wait for a TCP / TLS handshake. A
// hung server would otherwise tie up an event-bus goroutine in the
// kernel; 15s is generous for real-world SMTP relays and short
// enough to fail loud during outages.
const dialTimeout = 15 * time.Second

// tlsMinConfig returns a *tls.Config pinned to TLS 1.2+. We don't
// touch ciphers (Go's defaults are sane) and we keep certificate
// verification on (default). ServerName MUST be the SNI hostname so
// hostname verification works against the cert's SAN list.
func tlsMinConfig(host string) *tls.Config {
	return &tls.Config{
		ServerName: host,
		MinVersion: tls.VersionTLS12,
	}
}

// validateHost rejects SMTP hostnames containing CRLF, whitespace,
// or characters that could escape the addr formatting downstream.
// This is defense in depth — the kernel-side settings handler already
// strips control characters, but the plugin must not trust its
// inputs blindly either.
func validateHost(host string) error {
	if host == "" {
		return fmt.Errorf("SMTP host is required")
	}
	for _, r := range host {
		if r == '\r' || r == '\n' || r == ' ' || r == '\t' || r == 0 {
			return fmt.Errorf("SMTP host contains invalid character %q", r)
		}
	}
	return nil
}

// SMTPPlugin implements the ExtensionPlugin interface.
type SMTPPlugin struct {
	host *coreapi.GRPCHostClient
}

func (p *SMTPPlugin) GetSubscriptions() ([]*pb.Subscription, error) {
	return []*pb.Subscription{
		{EventName: "email.send", Priority: 10},
	}, nil
}

func (p *SMTPPlugin) HandleEvent(action string, payload []byte) (*pb.EventResponse, error) {
	if action != "email.send" {
		return &pb.EventResponse{Handled: false}, nil
	}

	var req struct {
		To       []string          `json:"to"`
		Subject  string            `json:"subject"`
		HTML     string            `json:"html"`
		CC       []string          `json:"cc"`
		BCC      []string          `json:"bcc"`
		ReplyTo  string            `json:"reply_to"`
		Settings map[string]string `json:"settings"`
	}
	if err := json.Unmarshal(payload, &req); err != nil {
		return &pb.EventResponse{Handled: true, Error: fmt.Sprintf("invalid payload: %v", err)}, nil
	}

	host := req.Settings["host"]
	port := req.Settings["port"]
	username := req.Settings["username"]
	password := req.Settings["password"]
	fromEmail := req.Settings["from_email"]
	fromName := req.Settings["from_name"]
	encryption := req.Settings["encryption"]

	if err := validateHost(host); err != nil {
		return &pb.EventResponse{Handled: true, Error: err.Error()}, nil
	}
	if fromEmail == "" {
		return &pb.EventResponse{Handled: true, Error: "from_email is required"}, nil
	}

	// Validate fields to prevent email header injection.
	for _, field := range []string{fromEmail, fromName, req.Subject} {
		if strings.ContainsAny(field, "\r\n") {
			return &pb.EventResponse{Handled: true, Error: "invalid characters in email fields"}, nil
		}
	}
	for _, list := range [][]string{req.To, req.CC, req.BCC, {req.ReplyTo}} {
		for _, a := range list {
			if strings.ContainsAny(a, "\r\n") {
				return &pb.EventResponse{Handled: true, Error: "invalid characters in recipient address"}, nil
			}
		}
	}

	if port == "" {
		switch encryption {
		case "tls":
			port = "465"
		default:
			port = "587"
		}
	}

	// When encryption is unset we default to STARTTLS rather than
	// plaintext. Port 587 (the typical default port) is the canonical
	// STARTTLS port; defaulting "" → "plain" silently exposed creds
	// on the wire. Operators who genuinely need plaintext (Mailpit,
	// MailHog, local SMTP catchers) must set encryption="none"
	// explicitly.
	if encryption == "" {
		encryption = "starttls"
	}

	// Build the email message using RFC-safe encoding.
	from := fromEmail
	if fromName != "" {
		from = (&mail.Address{Name: fromName, Address: fromEmail}).String()
	}

	addr := net.JoinHostPort(host, port)

	for _, d := range planDeliveries(req.To, req.CC, req.BCC) {
		msg := buildMessage(from, d.toHeader, d.ccHeader, req.ReplyTo, req.Subject, req.HTML)
		for _, rcpt := range d.rcpts {
			var err error
			switch encryption {
			case "tls":
				err = sendImplicitTLS(addr, host, username, password, fromEmail, rcpt, msg)
			case "starttls":
				err = sendSTARTTLS(addr, host, username, password, fromEmail, rcpt, msg)
			default: // "none" or empty
				err = sendPlain(addr, host, username, password, fromEmail, rcpt, msg)
			}
			if err != nil {
				return &pb.EventResponse{Handled: true, Error: fmt.Sprintf("SMTP send failed: %v", err)}, nil
			}
		}
	}

	return &pb.EventResponse{Handled: true}, nil
}

func (p *SMTPPlugin) HandleHTTPRequest(req *pb.PluginHTTPRequest) (*pb.PluginHTTPResponse, error) {
	return &pb.PluginHTTPResponse{StatusCode: 404, Body: []byte(`{"error":"not found"}`)}, nil
}

func (p *SMTPPlugin) Shutdown() error {
	return nil
}

func (p *SMTPPlugin) Initialize(hostConn *grpc.ClientConn) error {
	p.host = coreapi.NewGRPCHostClient(coreapipb.NewSquillaHostClient(hostConn))
	return nil
}

// ---------- Message building ----------

// delivery is one message (its visible To/Cc headers) and the envelope
// recipients it is sent to.
type delivery struct {
	toHeader, ccHeader string
	rcpts              []string
}

// planDeliveries keeps the long-standing behaviour for plain sends — one
// private message per To address, so two admins never see each other —
// and switches to a single shared message when Cc or Bcc is set, because
// Cc only means something when everyone gets the same message. Bcc
// addresses get that message without appearing in any header.
func planDeliveries(to, cc, bcc []string) []delivery {
	to, cc, bcc = nonEmpty(to), nonEmpty(cc), nonEmpty(bcc)
	if len(cc) == 0 && len(bcc) == 0 {
		out := make([]delivery, 0, len(to))
		for _, t := range to {
			out = append(out, delivery{toHeader: t, rcpts: []string{t}})
		}
		return out
	}
	rcpts := append(append(append([]string{}, to...), cc...), bcc...)
	return []delivery{{toHeader: strings.Join(to, ", "), ccHeader: strings.Join(cc, ", "), rcpts: rcpts}}
}

func nonEmpty(in []string) []string {
	out := make([]string, 0, len(in))
	for _, s := range in {
		if s = strings.TrimSpace(s); s != "" {
			out = append(out, s)
		}
	}
	return out
}

func buildMessage(from, to, cc, replyTo, subject, html string) string {
	// Encode subject using RFC 2047 Q-encoding to handle special characters safely.
	encodedSubject := mime.QEncoding.Encode("utf-8", subject)
	var h strings.Builder
	fmt.Fprintf(&h, "From: %s\r\n", from)
	if to != "" {
		fmt.Fprintf(&h, "To: %s\r\n", to)
	}
	if cc != "" {
		fmt.Fprintf(&h, "Cc: %s\r\n", cc)
	}
	if replyTo = strings.TrimSpace(replyTo); replyTo != "" {
		fmt.Fprintf(&h, "Reply-To: %s\r\n", replyTo)
	}
	fmt.Fprintf(&h, "Subject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s", encodedSubject, html)
	return h.String()
}

// ---------- Implicit TLS (port 465) ----------

func sendImplicitTLS(addr, host, username, password, from, to, msg string) error {
	dialer := &net.Dialer{Timeout: dialTimeout}
	conn, err := tls.DialWithDialer(dialer, "tcp", addr, tlsMinConfig(host))
	if err != nil {
		return fmt.Errorf("TLS dial: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("SMTP client: %w", err)
	}
	defer client.Quit()

	if username != "" {
		// Connection is TLS, so standard PlainAuth is safe.
		if err := client.Auth(smtp.PlainAuth("", username, password, host)); err != nil {
			return fmt.Errorf("auth: %w", err)
		}
	}

	return sendEnvelope(client, from, to, msg)
}

// ---------- STARTTLS (port 587 typical) ----------

func sendSTARTTLS(addr, host, username, password, from, to, msg string) error {
	conn, err := net.DialTimeout("tcp", addr, dialTimeout)
	if err != nil {
		return fmt.Errorf("dial: %w", err)
	}
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		conn.Close()
		return fmt.Errorf("SMTP client: %w", err)
	}
	defer client.Quit()

	// Upgrade to TLS. If the server doesn't support STARTTLS, this
	// errors out — which is what we want: never silently fall back to
	// plaintext for a connection the operator asked to encrypt.
	if err := client.StartTLS(tlsMinConfig(host)); err != nil {
		return fmt.Errorf("STARTTLS: %w", err)
	}

	if username != "" {
		// After STARTTLS the connection is encrypted, so standard PlainAuth is safe.
		if err := client.Auth(smtp.PlainAuth("", username, password, host)); err != nil {
			return fmt.Errorf("auth: %w", err)
		}
	}

	return sendEnvelope(client, from, to, msg)
}

// ---------- Plain / no encryption ----------

// sendPlain delivers without any transport encryption. The custom
// plainAuth bypasses Go's smtp.PlainAuth TLS-or-localhost check —
// that's deliberate to keep dev catchers (Mailpit, MailHog) usable,
// but it's a foot-gun on a public network. Operators reach this path
// only by setting `encryption=none` explicitly.
func sendPlain(addr, host, username, password, from, to, msg string) error {
	conn, err := net.DialTimeout("tcp", addr, dialTimeout)
	if err != nil {
		return fmt.Errorf("dial: %w", err)
	}
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		conn.Close()
		return fmt.Errorf("SMTP client: %w", err)
	}
	defer client.Quit()

	if username != "" {
		auth := &plainAuth{username: username, password: password}
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("auth: %w", err)
		}
	}

	return sendEnvelope(client, from, to, msg)
}

// ---------- Shared envelope sending ----------

func sendEnvelope(client *smtp.Client, from, to, msg string) error {
	if err := client.Mail(from); err != nil {
		return fmt.Errorf("MAIL FROM: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("RCPT TO: %w", err)
	}
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("DATA: %w", err)
	}
	if _, err = w.Write([]byte(msg)); err != nil {
		return fmt.Errorf("write: %w", err)
	}
	return w.Close()
}

// ---------- Auth that works over plain connections ----------

// plainAuth implements smtp.Auth without the TLS requirement,
// for dev/testing SMTP servers that don't use encryption.
type plainAuth struct {
	username, password string
}

func (a *plainAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	resp := []byte("\x00" + a.username + "\x00" + a.password)
	return "PLAIN", resp, nil
}

func (a *plainAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	if more {
		return nil, fmt.Errorf("unexpected server challenge")
	}
	return nil, nil
}

// ---------- Entry point ----------

func main() {
	goplugin.Serve(&goplugin.ServeConfig{
		HandshakeConfig: vibeplugin.Handshake,
		VersionedPlugins: map[int]goplugin.PluginSet{
			2: {"extension": &vibeplugin.ExtensionGRPCPlugin{Impl: &SMTPPlugin{}}},
		},
		GRPCServer: vibeplugin.NewGRPCServer,
	})
}
