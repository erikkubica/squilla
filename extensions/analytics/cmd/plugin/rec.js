/*! Squilla session recorder. No cookies, no storage, no fingerprint, no page text, no input values. */
(function run(w, d, n, s) {
  if (!s) return;
  // A page the browser is only pre-rendering has not been visited yet.
  if (d.prerendering) return d.addEventListener('prerenderingchange', function () { run(w, d, n, s); }, { once: true });
  // Consent mode: wait until the site's consent tool allows recording.
  if (s.getAttribute('data-consent') == '1' && w.squillaRecordingConsent !== true) {
    return w.addEventListener('squilla:recording-consent', function () { w.squillaRecordingConsent === true && run(w, d, n, s); });
  }
  // Inside a frame (the admin replay player, previews) nothing is recorded.
  if (w.top !== w) return;
  if (n.webdriver || n.doNotTrack == 1 || n.globalPrivacyControl || !w.fetch || !w.crypto) return;
  var rate = +s.getAttribute('data-rate');
  if (rate > 0 && rate < 100 && Math.random() * 100 >= rate) return;

  var api = s.getAttribute('data-api'),
    de = d.documentElement,
    opt = { capture: true, passive: true },
    pid, seq, t0, buf, sent, dh, mx, my, mm, sc, rs, vw, vh, hov, gone, k = 0,
    clicks = [], errs = 0, vit = {}, mut = 0;
  if (!api) return;
  // A page can opt out entirely (checkout, account pages): <meta name="squilla-recording" content="off"> or <html data-sq-norecord>.
  if (de.hasAttribute('data-sq-norecord') || d.querySelector('meta[name="squilla-recording"][content="off"]')) return;

  function now() { return Date.now() - t0; }
  function ev(a) { a.unshift(now()); buf.push(a); }
  function on(t, e, f) { t.addEventListener(e, f, opt); }
  function link(e) { var t = e.target; return t && t.closest ? t.closest('a[href]') : null; }

  // Inside [data-sq-private] nothing identifying is kept: no selector, no link target.
  function priv(el) { return !!(el && el.closest && el.closest('[data-sq-private]')); }
  // Replayable selector: nearest id, else an nth-of-type chain from <body>.
  function path(el) {
    if (priv(el)) return '';
    for (var p = [], i, c; el && el.nodeType == 1 && el !== d.body && el !== de; el = el.parentNode) {
      if (el.id) return p.unshift('#' + CSS.escape(el.id)), p.join('>').slice(0, 500);
      for (i = 1, c = el; (c = c.previousElementSibling);) c.localName == el.localName && i++;
      p.unshift(el.localName + ':nth-of-type(' + i + ')');
    }
    return p.unshift('body'), p.join('>').slice(0, 500);
  }
  // Query strings and fragments can carry personal data: never sent.
  function bare(u) { return String(u || '').split(/[?#]/)[0].slice(0, 500); }

  function flush() {
    if (!buf.length) return;
    var h = de.scrollHeight, o;
    if (h != dh) ev(['d', dh = h]);
    o = { p: pid, s: seq++, e: buf };
    if (seq == 1) o.m = {
      u: bare(w.location.href), r: bare(d.referrer),
      w: w.innerWidth, h: w.innerHeight, dh: dh,
      sw: screen.width, sh: screen.height
    };
    buf = []; sent = now();
    o = JSON.stringify(o);
    // keepalive survives navigation; text/plain needs no preflight; omit never sends cookies.
    try { fetch(api, { method: 'POST', body: o, keepalive: o.length < 60000, credentials: 'omit', headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); }
    catch (e) { n.sendBeacon && n.sendBeacon(api, o); }
  }

  function start() {
    var a = new Uint32Array(4);
    w.crypto.getRandomValues(a);
    pid = [].map.call(a, function (x) { return x.toString(36); }).join('').slice(0, 32);
    seq = 0; t0 = Date.now(); buf = []; sent = 0; dh = de.scrollHeight; vw = w.innerWidth; vh = w.innerHeight; mm = sc = rs = gone = 0; hov = null;
    ev(['s', Math.round(w.scrollX), Math.round(w.scrollY)]);
    flush();
  }

  on(d, 'mousemove', function (e) { mx = e.clientX; my = e.clientY; mm = 1; });
  on(w, 'scroll', function () { sc = 1; });
  on(w, 'resize', function () { rs = 1; });
  on(d, 'mouseover', function (e) {
    var a = link(e);
    if (a !== hov && (hov = a) && !priv(a)) ev(['h', path(a), bare(a.href)]);
  });
  on(d, 'mouseout', function (e) { if (!e.relatedTarget) { hov = null; ev(['l']); } });
  on(d, 'pointerdown', function (e) { link(e) && flush(); });
  // Interactive = something a click is expected to do something on.
  function live(el) {
    return el && el.closest && el.closest('a[href],button,input,select,textarea,label,summary,details,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[onclick],[contenteditable],[tabindex]:not([tabindex="-1"])');
  }
  if (w.MutationObserver) new MutationObserver(function () { mut = Date.now(); }).observe(de, { childList: true, subtree: true, attributes: true, characterData: true });
  on(d, 'click', function (e) {
    var a = link(e), x = Math.round(e.clientX), y = Math.round(e.clientY), sel = path(e.target), t = now(), at = Date.now(), sy = w.scrollY, u = location.href;
    ev(['c', x, y, sel, a && sel ? bare(a.href) : 0]);
    // Rage click: 3+ clicks within a second, close together (reported once per burst).
    clicks = clicks.filter(function (c) { return t - c[0] < 1000 && Math.abs(c[1] - x) < 30 && Math.abs(c[2] - y) < 30; });
    clicks.push([t, x, y]);
    if (clicks.length == 3) ev(['g', x, y, sel]);
    // Dead click: on something not interactive, and the page did not react within a second.
    if (!live(e.target)) setTimeout(function () {
      if (mut < at && w.scrollY == sy && location.href == u && !gone) ev(['k', x, y, sel]);
    }, 1000);
    a && flush();
  });
  // JavaScript errors: message and file name only (no stack, no query string), at most 20 per page.
  on(w, 'error', function (e) {
    if (e.message && errs++ < 20) ev(['e', String(e.message).slice(0, 200), bare(e.filename).split('/').pop(), e.lineno | 0]);
  });
  on(w, 'unhandledrejection', function (e) {
    var r = e.reason;
    if (errs++ < 20) ev(['e', String(r && r.message || r || 'Unhandled rejection').slice(0, 200), '', 0]);
  });
  // Core Web Vitals, measured in this browser: LCP, CLS, INP (slowest interaction), TTFB, FCP.
  function vital(m, v) { v = Math.round(v); if (vit[m] !== v) { vit[m] = v; ev(['w', m, v]); } }
  function po(type, f, o) { try { new PerformanceObserver(function (l) { l.getEntries().forEach(f); }).observe(o || { type: type, buffered: true }); } catch (e) {} }
  var cls = 0, inp = 0;
  po('largest-contentful-paint', function (x) { vital('lcp', x.startTime); });
  po('layout-shift', function (x) { if (!x.hadRecentInput) { cls += x.value; vital('cls', cls * 1000); } });
  po('event', function (x) { if (x.interactionId && x.duration > inp) vital('inp', inp = x.duration); }, { type: 'event', buffered: true, durationThreshold: 40 });
  po('paint', function (x) { x.name == 'first-contentful-paint' && vital('fcp', x.startTime); });
  try { var nav = performance.getEntriesByType('navigation')[0]; nav && vital('ttfb', nav.responseStart); } catch (e) {}
  on(d, 'focusin', function (e) { /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && ev(['f', path(e.target)]); });
  on(d, 'submit', function (e) { ev(['u', path(e.target)]); flush(); });
  on(d, 'visibilitychange', function () { if (!gone) { ev(['v', d.hidden ? 0 : 1]); d.hidden && flush(); } });
  on(w, 'pagehide', function () { gone = 1; ev(['x']); flush(); });
  on(w, 'pageshow', function (e) { e.persisted && start(); }); // back/forward cache = a new page view

  // Sample at 10 Hz, ship once a second when something happened; heartbeat every 15 s while visible.
  setInterval(function () {
    if (mm) { mm = 0; ev(['m', mx, my]); }
    if (sc) { sc = 0; ev(['s', Math.round(w.scrollX), Math.round(w.scrollY)]); }
    if (rs) { rs = 0; if (w.innerWidth != vw || w.innerHeight != vh) ev(['r', vw = w.innerWidth, vh = w.innerHeight]); }
    if (++k % 10 == 0) {
      if (!buf.length && !d.hidden && now() - sent > 15e3) ev(['p']);
      // Stop after 30 minutes on one page: enough to replay, bounded storage.
      if (now() > 18e5) { buf = []; return; }
      flush();
    }
  }, 100);

  start();
})(window, document, navigator, document.currentScript);
