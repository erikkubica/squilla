import { Panel } from "../../components/Panel";

export function PrivacyExplainer() {
  return (
    <Panel title="How it works & privacy">
      <div className="space-y-2.5 text-xs leading-relaxed text-an-ink-2">
        <p><strong>No JavaScript, no cookies.</strong> Every public page request is measured on the server. Your visitors download nothing extra.</p>
        <p>
          <strong>Daily anonymous visitors.</strong> A visitor is a one-way hash of the IP address, browser and language, mixed with a random salt that exists
          only in memory and is replaced at midnight (site timezone). IP addresses are never stored, and yesterday’s hashes can’t be linked to today’s.
          A restart also replaces the salt, so a visitor may be counted twice that day.
        </p>
        <p><strong>No query strings.</strong> Only known campaign parameters (utm_*, ref) are kept; click IDs are recorded as yes/no only.</p>
        <p><strong>Bots are separated.</strong> Crawlers, AI agents and link previews are classified and kept as daily counts, never as visitors.</p>
        <p><strong>Global Privacy Control</strong> is honoured: those requests count only toward totals.</p>
      </div>
    </Panel>
  );
}

export function KnownLimits() {
  return (
    <Panel title="Known limits">
      <ul className="list-disc space-y-2 pl-4 text-xs leading-relaxed text-an-ink-2">
        <li>
          <strong>Proxies:</strong> behind a load balancer or CDN, the real client IP must be trusted. Set <code>TRUSTED_PROXIES</code> (and{" "}
          <code>CLIENT_IP_HEADER</code>, e.g. <code>CF-Connecting-IP</code>) on the server, otherwise every request appears to come from the proxy and visitors collapse into one.
        </li>
        <li><strong>CDN caching:</strong> HTML served from a CDN cache never reaches the server and is not counted. Keep HTML uncached at the CDN.</li>
        <li><strong>Back/forward cache:</strong> pages restored instantly by the browser’s back/forward cache make no request and are invisible.</li>
        <li><strong>Estimated visitors:</strong> shared networks (CGNAT, offices), private relays and reduced user-agent strings merge or split people. Multi-day visitor counts are sums of daily uniques.</li>
        <li><strong>No time on page:</strong> without JavaScript, the length of a single-page visit is unknown; only multi-page visits have a length.</li>
      </ul>
    </Panel>
  );
}
