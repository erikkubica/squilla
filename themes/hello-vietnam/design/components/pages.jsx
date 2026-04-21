/* About, Contact, Gallery, Legal pages */

const About = ({ go }) => {
  const timeline = [
    { year: "2016", event: "Linh quits her bank job. Starts leading food tours for backpacker friends.", color: "red" },
    { year: "2018", event: "Tuan joins after driving Linh through Ha Giang on a whim. The loop is born.", color: "green" },
    { year: "2020", event: "Pandemic hits. We pivot to online cooking classes and stay connected.", color: "yellow" },
    { year: "2022", event: "We open a Hanoi office. Still just a room above a bánh mì shop.", color: "red" },
    { year: "2026", event: "2,400+ travelers later, we're still on plastic stools.", color: "green" },
  ];

  return (
    <div className="page-enter">
      <section style={{ padding: "48px 0 0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <span className="eyebrow">About us</span>
              <h1 style={{ marginBottom: 20 }}>We're not a tour company. We're your loud Vietnamese cousins.</h1>
              <p style={{ fontSize: "1.1rem", color: "var(--ink-soft)", marginBottom: 20 }}>
                Hello Vietnam started over a beer in 2016, when Linh realized most tourists were seeing her country through a tinted bus window. Ten years later, we've hand-built 18 trips across Vietnam — all led by people who grew up here.
              </p>
              <p style={{ color: "var(--ink-soft)" }}>
                We skip the tourist traps. We pay our guides fairly. We eat lunch on the same tiny plastic stools as our guests.
              </p>
            </div>
            <div className={phClass("team", "ph yellow")} style={{ height: 440, borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", ...photo("team") }}>
              <span className="ph-label">team photo · lunch on plastic stools</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="eyebrow">The origin story</span>
            <h2>From backpackers to local guides.</h2>
          </div>
          <div style={{ position: "relative", maxWidth: 880, margin: "0 auto" }}>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: "var(--line)", transform: "translateX(-50%)" }}/>
            {timeline.map((t, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 24, alignItems: "center", marginBottom: 40 }}>
                <div style={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-end" : "flex-start", gridColumn: i % 2 === 0 ? "1" : "3" }}>
                  <div className="card" style={{ padding: 22, maxWidth: 360 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 500, color: `var(--${t.color})`, marginBottom: 4 }}>{t.year}</div>
                    <p style={{ fontSize: "0.95rem" }}>{t.event}</p>
                  </div>
                </div>
                <div style={{ gridColumn: "2", justifySelf: "center", width: 18, height: 18, borderRadius: "50%", background: `var(--${t.color})`, border: "4px solid var(--cream)", boxShadow: "0 0 0 2px var(--line)", position: "relative", zIndex: 1 }}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CREW */}
      <section className="section" style={{ background: "var(--cream-warm)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="eyebrow">Meet the crew</span>
            <h2>The humans behind the adventure.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            {CREW.map((c, i) => (
              <div key={i} style={{
                background: "var(--white)", padding: 20, paddingBottom: 24,
                borderRadius: "var(--r-md)", boxShadow: "var(--shadow-sm)",
                transform: `rotate(${i % 2 === 0 ? "-1.5" : "1.5"}deg)`,
                transition: "transform .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "rotate(0deg) scale(1.03)"}
              onMouseLeave={e => e.currentTarget.style.transform = `rotate(${i % 2 === 0 ? "-1.5" : "1.5"}deg)`}>
                <div className={phClass(`portrait-${i+1}`, `ph ${c.color}`)} style={{ height: 260, borderRadius: "var(--r-sm)", marginBottom: 18, ...photo(`portrait-${i+1}`) }}>
                  <span className="ph-label">polaroid</span>
                </div>
                <h3 style={{ fontSize: "1.15rem", marginBottom: 2 }}>{c.name}</h3>
                <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: 10 }}>{c.role} · {c.based}</div>
                <div style={{ fontSize: "0.82rem", padding: "8px 12px", background: "var(--cream-warm)", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="sparkle" size={14}/>
                  <span><strong>Fun fact:</strong> {c.fun}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="eyebrow">What we stand for</span>
            <h2>Three rules we don't break.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { ico: "x", title: "No tourist traps", body: "If it's in every guidebook, we're not taking you there. Period.", c: "red" },
              { ico: "heart", title: "Supporting locals", body: "Every vendor we work with is a neighbor. Every guide earns a real wage.", c: "yellow" },
              { ico: "leaf", title: "Always sustainable", body: "Small groups, reusable everything, and trips that leave places better.", c: "green" },
            ].map((v, i) => (
              <div key={i} className="card" style={{ padding: 32 }}>
                <div className={`ph ${v.c}`} style={{ width: 60, height: 60, borderRadius: "50%", marginBottom: 20 }}>
                  <div style={{ color: v.c === "yellow" ? "#6B4F00" : v.c === "red" ? "var(--red-deep)" : "var(--green-deep)", position: "relative", zIndex: 1 }}>
                    <Icon name={v.ico} size={26}/>
                  </div>
                </div>
                <h3 style={{ marginBottom: 8 }}>{v.title}</h3>
                <p style={{ color: "var(--ink-soft)" }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div className={phClass("village-school", "ph green")} style={{ height: 380, borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", ...photo("village-school") }}>
              <span className="ph-label">village school · ba be province</span>
            </div>
            <div>
              <span className="eyebrow">Community impact</span>
              <h2 style={{ marginBottom: 16 }}>5% of every booking funds a village school.</h2>
              <p style={{ color: "var(--ink-soft)", marginBottom: 22 }}>
                Since 2019, we've helped build two classrooms and funded 47 scholarships in Ba Be Province. Our partner, the Ma Pi Leng Learning Initiative, is run by former guide Minh.
              </p>
              <a className="btn btn-green">Read the impact report <Icon name="arrow" size={16}/></a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact block */}
      <section className="section-tight" style={{ background: "var(--ink)", color: "var(--cream)", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ color: "var(--cream)", marginBottom: 14 }}>Got a question?</h2>
          <p style={{ opacity: 0.75, marginBottom: 24, maxWidth: 480, margin: "0 auto 24px" }}>We answer every WhatsApp within a few hours. Promise.</p>
          <a className="btn btn-yellow" onClick={() => go("contact")}>Let's chat <Icon name="arrow" size={18}/></a>
        </div>
      </section>
    </div>
  );
};

/* ------ CONTACT ------ */
const Contact = () => {
  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = React.useState(false);
  return (
    <div className="page-enter">
      <section className="section-tight" style={{ paddingTop: 60 }}>
        <div className="container" style={{ textAlign: "center" }}>
          <span className="eyebrow">Get in touch</span>
          <h1 style={{ marginBottom: 14 }}>We check our WhatsApp constantly.</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--ink-soft)", maxWidth: 560, margin: "0 auto" }}>
            Ping us any time. We're a small team — you'll hear back from a real human, probably Huong, probably within a few hours.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 56 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <div className="ph green" style={{ width: 50, height: 50, borderRadius: "50%", flexShrink: 0 }}>
                  <div style={{ position: "relative", zIndex: 1, color: "var(--green-deep)", display: "grid", placeItems: "center" }}><Icon name="whatsapp" size={22}/></div>
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: 0.06 }}>WhatsApp</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>+84 912 345 678</div>
                </div>
              </div>
              <div className="card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <div className="ph red" style={{ width: 50, height: 50, borderRadius: "50%", flexShrink: 0 }}>
                  <div style={{ position: "relative", zIndex: 1, color: "var(--red-deep)", display: "grid", placeItems: "center" }}><Icon name="mail" size={22}/></div>
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: 0.06 }}>Email</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>xinchao@hellovietnam.co</div>
                </div>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <div className="ph yellow" style={{ width: 50, height: 50, borderRadius: "50%", flexShrink: 0 }}>
                    <div style={{ position: "relative", zIndex: 1, color: "#6B4F00", display: "grid", placeItems: "center" }}><Icon name="pin" size={22}/></div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: 0.06 }}>Meet us</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>12 Hàng Cá St, Hanoi</div>
                  </div>
                </div>
                <div className="ph ink" style={{ height: 180, borderRadius: "var(--r-md)" }}>
                  <span className="ph-label">stylised map · hanoi old quarter</span>
                </div>
                <div style={{ marginTop: 14, fontSize: "0.88rem", color: "var(--ink-soft)" }}>
                  <strong>Mon–Sat:</strong> 9am – 8pm · <strong>Sun:</strong> Out eating
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a className="social-ico" style={{ background: "var(--ink)", color: "var(--cream)", borderColor: "var(--ink)" }}><Icon name="instagram" size={18}/></a>
                <a className="social-ico" style={{ background: "var(--ink)", color: "var(--cream)", borderColor: "var(--ink)" }}><Icon name="tiktok" size={18}/></a>
                <a className="social-ico" style={{ background: "var(--ink)", color: "var(--cream)", borderColor: "var(--ink)" }}><Icon name="whatsapp" size={18}/></a>
              </div>
            </div>

            <div className="card" style={{ padding: 36 }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div className="ph green" style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px" }}>
                    <div style={{ position: "relative", zIndex: 1, color: "var(--green-deep)" }}><Icon name="check" size={32}/></div>
                  </div>
                  <h3 style={{ marginBottom: 10 }}>Message sent!</h3>
                  <p style={{ color: "var(--ink-soft)" }}>We'll get back to you within a few hours. Check your email (and spam, just in case).</p>
                  <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>Send another</button>
                </div>
              ) : (
                <>
                  <h3 style={{ marginBottom: 6 }}>Drop us a line.</h3>
                  <p style={{ color: "var(--ink-soft)", marginBottom: 24, fontSize: "0.92rem" }}>We reply in the order we receive.</p>
                  <div style={{ display: "grid", gap: 16 }}>
                    <div className="field">
                      <label>Your name</label>
                      <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="What should we call you?"/>
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@somewhere.com"/>
                    </div>
                    <div className="field">
                      <label>Subject</label>
                      <select className="select" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                        <option value="">Pick one...</option>
                        <option>General question</option>
                        <option>Custom trip inquiry</option>
                        <option>Partnership / press</option>
                        <option>Something else</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Message</label>
                      <textarea className="textarea" value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Tell us what's on your mind..."/>
                    </div>
                    <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={() => form.name && form.email && setSent(true)}>
                      Send message <Icon name="arrow" size={18}/>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="section" style={{ background: "var(--cream-warm)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 48, alignItems: "start" }}>
            <div>
              <span className="eyebrow">Common questions</span>
              <h2>Solved before you ask.</h2>
            </div>
            <div>
              {FAQS.map((f, i) => <FAQ key={i} {...f}/>)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const FAQ = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", textAlign: "left", padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>{q}</span>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: open ? "var(--red)" : "var(--cream-warm)", color: open ? "var(--white)" : "var(--ink)", display: "grid", placeItems: "center", flexShrink: 0, transition: "all .15s" }}>
          <Icon name={open ? "minus" : "plus"} size={16}/>
        </div>
      </button>
      {open && <div style={{ paddingBottom: 18, color: "var(--ink-soft)", fontSize: "0.95rem" }}>{a}</div>}
    </div>
  );
};

/* ------ GALLERY ------ */
const Gallery = () => {
  const [filter, setFilter] = React.useState("All");
  const [lightbox, setLightbox] = React.useState(null);
  const cats = ["All", "Street Food", "Landscapes", "People", "Workshops"];
  const photos = [
    { cat: "Street Food", c: "red", tall: true, label: "bún chả hanoi", key: "pho-shop" },
    { cat: "People", c: "yellow", tall: false, label: "hmong weaver", key: "people-1" },
    { cat: "Landscapes", c: "green", tall: false, label: "ha giang sunrise", key: "ha-giang" },
    { cat: "Workshops", c: "red", tall: true, label: "lantern making", key: "lantern" },
    { cat: "Street Food", c: "yellow", tall: false, label: "phở dawn", key: "street-1" },
    { cat: "People", c: "green", tall: true, label: "boat lady mekong", key: "mekong" },
    { cat: "Landscapes", c: "red", tall: false, label: "sapa terraces", key: "sapa" },
    { cat: "Street Food", c: "green", tall: false, label: "bánh mì queen", key: "banh-mi" },
    { cat: "Workshops", c: "yellow", tall: true, label: "rice paper drying", key: "workshop-2" },
    { cat: "People", c: "red", tall: false, label: "kids, dong van", key: "people-2" },
    { cat: "Landscapes", c: "yellow", tall: false, label: "lotus pond", key: "landscape-1" },
    { cat: "Street Food", c: "ink", tall: true, label: "night market", key: "night-market" },
  ];
  const filtered = filter === "All" ? photos : photos.filter(p => p.cat === filter);

  return (
    <div className="page-enter">
      <section style={{ padding: "60px 0 40px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <span className="eyebrow">Gallery</span>
          <h1 style={{ marginBottom: 14 }}>Ten years of candid Vietnam.</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: "1.05rem", maxWidth: 560, margin: "0 auto 32px" }}>
            Real moments from real trips. No stock photos, no AI, no filters.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)} className="nav-link" style={{
                padding: "10px 18px",
                background: filter === c ? "var(--ink)" : "var(--white)",
                color: filter === c ? "var(--cream)" : "var(--ink)",
                border: `1px solid ${filter === c ? "var(--ink)" : "var(--line)"}`,
                fontSize: "0.88rem",
              }}>{c}</button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "20px 0 60px" }}>
        <div className="container">
          <div style={{ columnCount: 4, columnGap: 16 }}>
            {filtered.map((p, i) => (
              <div key={i} onClick={() => setLightbox(p)} className={phClass(p.key, `ph ${p.c}`)} style={{
                breakInside: "avoid", marginBottom: 16,
                height: p.tall ? 340 : 240,
                borderRadius: "var(--r-md)",
                cursor: "zoom-in",
                transition: "transform .2s",
                ...photo(p.key),
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                <span className="ph-label">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed", inset: 0, background: "rgba(44,62,80,.92)", zIndex: 200,
          display: "grid", placeItems: "center", padding: 40,
          animation: "fadeUp .2s ease",
        }}>
          <button style={{ position: "absolute", top: 24, right: 24, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.15)", color: "var(--white)", display: "grid", placeItems: "center" }}>
            <Icon name="x" size={22}/>
          </button>
          <div className={phClass(lightbox.key, `ph ${lightbox.c}`)} style={{ width: "min(900px, 90vw)", height: "min(640px, 80vh)", borderRadius: "var(--r-lg)", ...photo(lightbox.key) }} onClick={e => e.stopPropagation()}>
            <span className="ph-label">{lightbox.label}</span>
          </div>
        </div>
      )}

      <section className="section-tight" style={{ background: "var(--yellow)", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ marginBottom: 10 }}>Want to be featured?</h2>
          <p style={{ marginBottom: 18 }}>Tag <strong>@HelloVietnam</strong> on your next trip — we repost our favorites every week.</p>
        </div>
      </section>
    </div>
  );
};

/* ------ LEGAL ------ */
const Legal = ({ go }) => (
  <div className="page-enter">
    <section style={{ padding: "40px 0 60px" }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: 20, display: "flex", gap: 8 }}>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Home</a>
          <span>›</span>
          <span>Legal</span>
          <span>›</span>
          <span style={{ color: "var(--ink)" }}>Privacy Policy</span>
        </div>
        <h1 style={{ marginBottom: 20 }}>Privacy Policy</h1>
        <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)", marginBottom: 32 }}>Last updated: April 2026</div>

        <div style={{
          background: "var(--yellow-soft)", border: "2px dashed #c49a00",
          padding: 24, borderRadius: "var(--r-lg)", marginBottom: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Icon name="sparkle" size={20}/>
            <h3 style={{ fontSize: "1.05rem" }}>Too long? Here's the summary</h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.95rem", lineHeight: 1.7 }}>
            <li>We only collect info you give us (email, booking details).</li>
            <li>We never sell your data. We're a tiny company; we don't even know how to.</li>
            <li>We use it to run your trip and send you occasional emails (unsubscribe any time).</li>
            <li>You can ask us to delete everything about you. Just reply to any email.</li>
          </ul>
        </div>

        <div style={{ fontSize: "1rem", lineHeight: 1.75, color: "var(--ink)" }}>
          <h3 style={{ marginTop: 32, marginBottom: 10 }}>1. Who we are</h3>
          <p style={{ marginBottom: 16 }}>Hello Vietnam Adventures is a registered tour operator based in Hanoi, Vietnam (License #HN-2021-0847). We operate this website and handle bookings through it.</p>

          <h3 style={{ marginTop: 32, marginBottom: 10 }}>2. What we collect</h3>
          <p style={{ marginBottom: 16 }}>When you book a trip, fill out a form, or email us, we collect your name, email, phone number, dietary needs, and any other info you share. We also collect anonymous analytics (how many people visited the site, which pages are popular).</p>

          <h3 style={{ marginTop: 32, marginBottom: 10 }}>3. How we use it</h3>
          <p style={{ marginBottom: 16 }}>To run your trip, coordinate logistics, send booking confirmations, and occasionally email you about new experiences (only if you opt in). That's it.</p>

          <h3 style={{ marginTop: 32, marginBottom: 10 }}>4. Your rights</h3>
          <p style={{ marginBottom: 16 }}>You can ask us to show you everything we have on file, correct it, or delete it. Just email <strong>xinchao@hellovietnam.co</strong>.</p>
        </div>

        <div style={{ marginTop: 48, padding: 24, background: "var(--cream-warm)", borderRadius: "var(--r-lg)", display: "flex", alignItems: "center", gap: 16 }}>
          <Icon name="mail" size={22}/>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Have a concern?</div>
            <div style={{ fontSize: "0.9rem", color: "var(--ink-soft)" }}>Email us at xinchao@hellovietnam.co — we take privacy seriously.</div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

window.About = About;
window.Contact = Contact;
window.Gallery = Gallery;
window.Legal = Legal;
window.FAQ = FAQ;
