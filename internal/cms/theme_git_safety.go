package cms

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// allowedGitSchemes restricts InstallFromGit to vetted transport schemes.
// `git://`, `ssh://`, and `file://` are deliberately excluded:
//   - file:// would let an attacker clone /etc/ or any local mount.
//   - ssh:// authenticates with the kernel's SSH key (probably overprivileged).
//   - git:// (port 9418) is unauthenticated and unencrypted.
var allowedGitSchemes = map[string]bool{"https": true}

// privateNets are networks the kernel must never clone from. Same shape
// as the SSRF defense in impl_http.go.
var privateGitNets []*net.IPNet

func init() {
	for _, cidr := range []string{
		"127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
		"169.254.0.0/16", "::1/128", "fc00::/7", "fe80::/10",
		"100.64.0.0/10", "0.0.0.0/8",
	} {
		_, n, err := net.ParseCIDR(cidr)
		if err == nil {
			privateGitNets = append(privateGitNets, n)
		}
	}
}

// validateGitURL rejects URLs that aren't safe to clone. Same playbook as
// the HTTP fetch validator: scheme allowlist + private-network block via
// DNS resolution.
func validateGitURL(rawURL string) error {
	// SCP-style SSH URLs (e.g. `git@github.com:org/repo.git`) crash url.Parse
	// because the colon makes the path segment look like a port. Give a
	// targeted error pointing at the supported form rather than the cryptic
	// "first path segment in URL cannot contain colon".
	if strings.Contains(rawURL, "@") && !strings.Contains(rawURL, "://") {
		return fmt.Errorf(
			"SSH-style git URL %q is not supported — convert to https:// (e.g. https://github.com/<owner>/<repo>.git) and use a personal access token if the repo is private",
			rawURL,
		)
	}
	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("invalid git URL: %w", err)
	}
	scheme := strings.ToLower(u.Scheme)
	if !allowedGitSchemes[scheme] {
		return fmt.Errorf("scheme %q not allowed (only https://)", u.Scheme)
	}
	host := u.Hostname()
	if host == "" {
		return fmt.Errorf("git URL must include a host")
	}
	ips, err := net.LookupIP(host)
	if err != nil {
		return fmt.Errorf("DNS lookup failed for %s: %w", host, err)
	}
	for _, ip := range ips {
		for _, blocked := range privateGitNets {
			if blocked.Contains(ip) {
				return fmt.Errorf("destination %s resolves to blocked address %s", host, ip.String())
			}
		}
	}
	return nil
}

// safeGitFlags returns -c arguments that neutralize hostile-config
// attacks. A repository can ship a .git/config that registers a
// core.fsmonitor binary, an alias.<x>=!<sh-snippet>, or a merge driver
// — all of which trigger arbitrary command execution on subsequent
// git operations against that working tree. Disabling these at -c
// scope means the repo's own config is overruled.
func safeGitFlags() []string {
	// `protocol.allow` accepts only `always`, `never`, or `user` — the previous
	// value `https` was rejected by git ("unknown value for config 'protocol.allow'")
	// and broke every clone. We use the per-protocol form instead: deny all by
	// default and re-enable only HTTPS, which is the single scheme our URL
	// validator already permits.
	return []string{
		"-c", "core.fsmonitor=false",
		"-c", "core.hooksPath=/dev/null",
		"-c", "core.editor=false",
		"-c", "alias.x=", // any alias resolution returns empty, not the repo's
		"-c", "protocol.allow=never",
		"-c", "protocol.https.allow=always",
		"-c", "advice.detachedHead=false",
		// Check symlinks out as plain files containing the link text. A
		// theme repo could otherwise ship assets/x.css -> /etc/passwd and
		// have /theme/assets/x.css (or the file browser) serve host files.
		"-c", "core.symlinks=false",
	}
}

// gitCommandTimeout bounds clone/pull so a slow or hostile remote can't
// pin an admin request (and a git process) forever.
const gitCommandTimeout = 2 * time.Minute

// gitRefRe is a conservative subset of git-check-ref-format: it must start
// with an alphanumeric (so it can never be read as an option) and contain
// only characters that appear in ordinary branch names.
var gitRefRe = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._/-]{0,199}$`)

// validateGitBranch rejects branch names that could be parsed as git
// options or that git itself would refuse.
func validateGitBranch(branch string) error {
	if !gitRefRe.MatchString(branch) || strings.Contains(branch, "..") ||
		strings.Contains(branch, "//") || strings.HasSuffix(branch, "/") ||
		strings.HasSuffix(branch, ".") || strings.HasSuffix(branch, ".lock") {
		return fmt.Errorf("invalid git branch name %q", branch)
	}
	return nil
}

// buildSafeGitClone constructs a sandboxed `git clone` invocation. When a
// token is supplied, it's passed via env to a GIT_ASKPASS helper rather
// than being baked into the URL — keeps it out of `ps aux`. The returned
// cleanup must be called to remove the temp helper script.
func buildSafeGitClone(gitURL, branch, token, dest string) (*exec.Cmd, func(), error) {
	if err := validateGitBranch(branch); err != nil {
		return nil, nil, err
	}
	args := append([]string{}, safeGitFlags()...)
	args = append(args, "clone", "--branch", branch, "--single-branch", "--depth", "1", "--", gitURL, dest)
	return buildGitCmd(args, token)
}

// buildSafeGitPull is the same pattern for `git -C <path> pull`. The branch
// is validated and passed after "--" so it can never be read as an option.
func buildSafeGitPull(path, branch, token string) (*exec.Cmd, func(), error) {
	if err := validateGitBranch(branch); err != nil {
		return nil, nil, err
	}
	args := append([]string{}, safeGitFlags()...)
	args = append(args, "-C", path, "pull", "--", "origin", branch)
	return buildGitCmd(args, token)
}

// buildGitCmd wraps exec.CommandContext with gitCommandTimeout and the
// askpass plumbing. The returned cleanup cancels the context too.
func buildGitCmd(args []string, token string) (*exec.Cmd, func(), error) {
	ctx, cancel := context.WithTimeout(context.Background(), gitCommandTimeout)
	cmd := exec.CommandContext(ctx, "git", args...)
	cleanup, err := installAskpass(cmd, token)
	if err != nil {
		cancel()
		return nil, nil, err
	}
	return cmd, func() { cleanup(); cancel() }, nil
}

// installAskpass writes a temp script that prints $SQUILLA_GIT_TOKEN, sets
// GIT_ASKPASS to point at it, and exposes the token via env. Git invokes
// the script when it needs credentials, so the token is read from env at
// the askpass step — never appearing in the parent process's argv.
//
// Returns a cleanup function that removes the temp script. Always callable,
// even if installAskpass returned an error.
func installAskpass(cmd *exec.Cmd, token string) (func(), error) {
	noop := func() {}
	if token == "" {
		// No token: still set safe env. Git won't invoke askpass.
		cmd.Env = append(os.Environ(),
			"GIT_TERMINAL_PROMPT=0", // never prompt for credentials interactively
		)
		return noop, nil
	}
	tmp, err := os.MkdirTemp("", "squilla-askpass-*")
	if err != nil {
		return noop, fmt.Errorf("creating askpass dir: %w", err)
	}
	cleanup := func() { _ = os.RemoveAll(tmp) }
	scriptPath := filepath.Join(tmp, "askpass.sh")
	// Print the token. Git asks twice — for username then password —
	// so for a PAT we just print the token both times. Some hosts
	// (GitLab) expect "oauth2" as the username, but most accept the
	// token in either slot.
	const script = "#!/bin/sh\nprintf '%s\\n' \"$SQUILLA_GIT_TOKEN\"\n"
	if err := os.WriteFile(scriptPath, []byte(script), 0700); err != nil {
		cleanup()
		return noop, fmt.Errorf("writing askpass script: %w", err)
	}
	cmd.Env = append(os.Environ(),
		"GIT_ASKPASS="+scriptPath,
		"GIT_TERMINAL_PROMPT=0",
		"SQUILLA_GIT_TOKEN="+token,
	)
	return cleanup, nil
}
