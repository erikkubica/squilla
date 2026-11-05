import { Panel } from "../../components/Panel";

export const PRIVACY_NOTICE =
  "We measure how our website is used without cookies and without storing your IP address. Each day a random value that exists only in memory " +
  "turns your connection into an anonymous visit number; it is replaced at midnight, so we cannot recognise you from one day to the next. " +
  "We count page views, how far down a page a section scrolled into view, how long a page stayed open and which links were clicked. " +
  "We do not share this data. You can switch measurement off at any time on the opt-out page, and we respect the Global Privacy Control signal.";

export function PrivacyExplainer({ prefix = "/_s" }: { prefix?: string }) {
  return (
    <Panel title="How it works & privacy">
      <div className="space-y-2.5 text-xs leading-relaxed text-an-ink-2">
        <p><strong>No analytics JavaScript, no cookies.</strong> Every public page request is measured on the server. With in-page signals on, the page also carries a small stylesheet; the browser asks your own server for tiny images as parts of the page are seen. Nothing is loaded from another domain.</p>
        <p>
          <strong>Daily anonymous visitors.</strong> A visitor is a one-way hash of the IP address, browser and language, mixed with a random salt that exists
          only in memory and is replaced at midnight (site timezone). IP addresses are never stored. Visits that are open at midnight are carried across the
          change for one session timeout, using yesterday’s salt from memory; it is never written to disk.
        </p>
        <p><strong>No identifiers in signals.</strong> Signal URLs contain only a page number and a section name. Which visit a signal belongs to is worked out on the server from the same daily hash.</p>
        <p><strong>No query strings.</strong> Only known campaign parameters (utm_*, ref) are kept; click IDs are recorded as yes/no only. Outbound destinations are stored as host and path.</p>
        <p><strong>Bots are separated.</strong> Crawlers, AI agents and link previews are classified and kept as daily counts, never as visitors.</p>
        <p>
          <strong>Opt-out and Global Privacy Control.</strong> Visitors can switch measurement off at <code>{prefix}/optout</code> (one small cookie). Browsers that send
          Global Privacy Control, and signed-in editors, get no measurement markup at all.
        </p>
        <p>
          <strong>Legal basis.</strong> EDPB Guidelines 2/2023 treat a request made only for measurement as access to the device (ePrivacy Art. 5(3)). The CNIL exempts
          strictly anonymous audience measurement from consent when visitors are informed and can opt out; that is the model here. Other regulators may differ — check yours.
        </p>
        <div>
          <strong>Privacy-notice paragraph</strong> (copy into your privacy page, with a link to the opt-out page):
          <textarea readOnly rows={6} value={PRIVACY_NOTICE} aria-label="Privacy notice text" className="an-focus mt-1.5 w-full rounded-md border border-an-line bg-an-surface p-2 text-xs" onFocus={(e) => e.currentTarget.select()} />
        </div>
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
        <li><strong>Time on page:</strong> single-page visits have a length only with in-page signals; stay marks are 10 s, 30 s, 1 min and 3 min.</li>
        <li><strong>Link clicks:</strong> use the browser’s link ping, which Firefox, some privacy browsers and ad blockers do not send. Click-through rates for those visitors are understated.</li>
        <li><strong>Browsers:</strong> section signals need scroll-driven animations (Chrome/Edge, Safari 26+, recent Firefox). Others still send activation and stay marks.</li>
      </ul>
    </Panel>
  );
}
