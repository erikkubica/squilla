import type { ReactNode } from "react";
import { ChevronDown } from "@squilla/icons";
import { Panel } from "../../components/Panel";

export const PRIVACY_NOTICE =
  "We measure how our website is used without cookies and without storing your IP address. Each day a random value that exists only in memory " +
  "turns your connection into an anonymous visit number; it is replaced at midnight, so we cannot recognise you from one day to the next. " +
  "We count page views, how far down a page a section scrolled into view, how long a page stayed open and which links were clicked. " +
  "We do not share this data. You can switch measurement off at any time on the opt-out page, and we respect the Global Privacy Control signal.";

function Q({ q, children, id }: { q: string; children: ReactNode; id?: string }) {
  return (
    <details id={id} className={id ? "an-anchor" : undefined}>
      <summary className="an-focus">
        {q}
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="an-faq-body">{children}</div>
    </details>
  );
}

/** Plain-language answers to the questions people ask about privacy and accuracy. */
export function PrivacyFaq({ prefix = "/_s" }: { prefix?: string }) {
  return (
    <Panel title="Questions & answers" subtitle="Privacy, accuracy and what to tell your visitors" bodyClassName="p-0">
      <div className="an-faq">
        <Q q="Do I need a cookie banner?">
          <p>Not for Analytics. It sets no cookies and loads no tracking scripts; every page view is counted by your own server.</p>
          <p>
            If you turn on <strong>in-page measurement</strong>, add the short paragraph from that section to your privacy page, with a link to the opt-out page. That follows the
            French CNIL’s exemption for anonymous audience measurement. Rules differ between countries, so check yours if you are unsure.
          </p>
        </Q>
        <Q q="What exactly is stored?">
          <ul>
            <li>The page address, the site that sent the visitor, and campaign tags (utm_…). Other query strings are dropped.</li>
            <li>Country, browser language, device type, browser and operating system.</li>
            <li>An anonymous daily visit number. IP addresses are never stored.</li>
            <li>With in-page measurement: which sections were seen, time marks (10 s, 30 s, 1 min, 3 min) and which links were clicked.</li>
          </ul>
        </Q>
        <Q q="How are visitors counted without cookies?">
          <p>
            Each day the server mixes the visitor’s network address, browser and language with a random value that exists only in memory, and keeps the
            one-way result. At midnight the value is replaced, so nobody can be recognised from one day to the next.
          </p>
          <p>That’s why visitor numbers over several days are estimates: someone who visits on three days counts as three visitors.</p>
        </Q>
        <Q q="Why don’t my numbers match Google Analytics?">
          <ul>
            <li>Bots, AI crawlers and link previews are left out here and shown separately under Bots & AI.</li>
            <li>Your own visits are skipped while you’re logged in.</li>
            <li>Ad blockers can’t stop page views from being counted, because that happens on your server. Many of them block Google Analytics.</li>
            <li>Google Analytics follows people across days with cookies; Analytics counts people once per day.</li>
          </ul>
        </Q>
        <Q q="Why is a visit missing?" id="missing-visits">
          <ul>
            <li><strong>You were logged in.</strong> Open your site in a private window to test.</li>
            <li><strong>A CDN served the page from its cache</strong>, so the request never reached your server. Keep HTML pages uncached at the CDN.</li>
            <li><strong>The browser restored the page instantly</strong> with the back button. These pages make no request and can’t be seen.</li>
            <li>
              <strong>Behind a proxy or load balancer</strong> every visitor can look like one. Set <code>TRUSTED_PROXIES</code> and, behind Cloudflare,{" "}
              <code>CLIENT_IP_HEADER=CF-Connecting-IP</code> on the server.
            </li>
          </ul>
        </Q>
        <Q q="How accurate is in-page measurement?">
          <ul>
            <li>Time on page is measured in steps: 10 s, 30 s, 1 min and 3 min.</li>
            <li>Firefox and some ad blockers don’t report link clicks, so real click numbers are a bit higher.</li>
            <li>Section views need a recent browser (Chrome, Edge, Safari 26 or newer, recent Firefox). Older browsers still report time on page.</li>
          </ul>
        </Q>
        <Q q="Can visitors switch it off?">
          <p>
            Yes. The opt-out page at <code>{prefix}/optout</code> sets one small cookie that turns measurement off for that browser. When “Respect Global Privacy
            Control” is on, browsers that send that signal are only counted in totals.
          </p>
        </Q>
      </div>
    </Panel>
  );
}
