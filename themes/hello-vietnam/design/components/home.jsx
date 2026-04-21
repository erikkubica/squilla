/* Home page */
const Home = ({ go, openTrip }) => {
  const cats = [
    { icon: "food", label: "Street Food", color: "red" },
    { icon: "trail", label: "Hidden Trails", color: "green" },
    { icon: "workshop", label: "Local Workshops", color: "yellow" },
    { icon: "family", label: "Family Fun", color: "ink" },
  ];

  return (
    <div className="page-enter">
      {/* HERO */}
      <section style={{ padding: "48px 0 60px", position: "relative" }}>
        <div className="container" style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
            <div>
              <span className="badge badge-yellow" style={{ marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, background: "#c49a00", borderRadius: 999 }}></span>
                Xin chào! We're Hello Vietnam.
              </span>
              <h1 style={{ marginBottom: 22 }}>
                Eat, wander, &<br/>
                <span style={{ color: "var(--red)" }}>laugh </span>
                your way<br/>
                through <span style={{ position: "relative", display: "inline-block" }}>
                  Vietnam
                  <svg style={{ position: "absolute", left: 0, bottom: -8, width: "100%", height: 14 }} viewBox="0 0 240 14" preserveAspectRatio="none">
                    <path d="M2 8 Q60 2 120 7 T238 6" stroke="var(--yellow)" strokeWidth="6" fill="none" strokeLinecap="round"/>
                  </svg>
                </span>.
              </h1>
              <p style={{ fontSize: "1.15rem", color: "var(--ink-soft)", marginBottom: 32, maxWidth: 540 }}>
                Small-group food crawls, mountain loops, and cooking classes — all run by locals who actually live here. No buses. No bullhorns. Just your new favorite country.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a className="btn btn-primary" onClick={() => go("trips")}>
                  Find Your Adventure <Icon name="arrow" size={18}/>
                </a>
                <a className="btn btn-ghost" onClick={() => go("about")}>Meet the Crew</a>
              </div>
              <div style={{ display: "flex", gap: 28, marginTop: 40, alignItems: "center" }}>
                <div style={{ display: "flex" }}>
                  {["red", "yellow", "green", "ink"].map((c, i) => (
                    <div key={i} className={`ph ${c}`} style={{ width: 40, height: 40, borderRadius: "50%", marginLeft: i ? -10 : 0, border: "2px solid var(--cream)" }}/>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 2, color: "var(--yellow)" }}>
                    {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={16}/>)}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: 2 }}>
                    <strong style={{ color: "var(--ink)" }}>2,400+ travelers</strong> · Rated 4.9 on TripAdvisor
                  </div>
                </div>
              </div>
            </div>
            {/* Hero visual */}
            <div style={{ position: "relative", height: 560 }}>
              <div className={phClass("hero-hanoi", "ph red")} style={{ position: "absolute", top: 0, right: 0, width: "78%", height: "70%", borderRadius: "var(--r-xl)", transform: "rotate(1.5deg)", boxShadow: "var(--shadow-lg)", ...photo("hero-hanoi") }}>
                <span className="ph-label">hero · bún chả grandma, hanoi</span>
              </div>
              <div className={phClass("rice-terrace", "ph yellow")} style={{ position: "absolute", bottom: 0, left: 0, width: "56%", height: "48%", borderRadius: "var(--r-xl)", transform: "rotate(-3deg)", boxShadow: "var(--shadow-lg)", ...photo("rice-terrace") }}>
                <span className="ph-label">rice terrace · sapa</span>
              </div>
              <div className={phClass("tea", "ph green")} style={{ position: "absolute", bottom: "18%", right: "6%", width: "32%", height: "28%", borderRadius: "var(--r-lg)", transform: "rotate(6deg)", boxShadow: "var(--shadow-md)", ...photo("tea") }}>
                <span className="ph-label">tea farm</span>
              </div>
              <div style={{ position: "absolute", top: "8%", left: "-4%", background: "var(--yellow)", padding: "10px 16px", borderRadius: "var(--r-pill)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.88rem", transform: "rotate(-8deg)", boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="sparkle" size={16}/> 100% local-guided
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section style={{ padding: "40px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--cream-warm)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {cats.map((c, i) => (
              <a key={i} onClick={() => go("trips")} style={{
                padding: "20px 16px", display: "flex", alignItems: "center", gap: 16,
                borderRight: i < 3 ? "1px solid var(--line)" : "none",
                cursor: "pointer", transition: "background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.5)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div className={`ph ${c.color}`} style={{ width: 54, height: 54, borderRadius: "50%", flexShrink: 0 }}>
                  <div style={{ color: c.color === "yellow" ? "#6B4F00" : c.color === "red" ? "var(--red-deep)" : c.color === "green" ? "var(--green-deep)" : "var(--ink)", position: "relative", zIndex: 1 }}>
                    <Icon name={c.icon} size={26}/>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>{c.label}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>Explore →</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED EXPERIENCE */}
      <section className="section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div className={phClass("pho-shop", "ph red")} style={{ height: 480, borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", ...photo("pho-shop") }}>
              <span className="ph-label">pho shop · steaming bowls, early morning</span>
            </div>
            <div>
              <span className="eyebrow">Featured Experience</span>
              <h2 style={{ marginBottom: 20 }}>Phở at 6am, like the locals mean it.</h2>
              <p style={{ fontSize: "1.05rem", color: "var(--ink-soft)", marginBottom: 24 }}>
                Mrs. Hương's shop has been running since 1982. She yells at her sons, slurps her coffee, and ladles the clearest beef broth in Hanoi into your bowl at sunrise. We've been bringing people here since 2018 and she still remembers everyone's name.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                {[
                  { icon: "clock", label: "4 hours" },
                  { icon: "pin", label: "Old Quarter" },
                  { icon: "family", label: "Small group · max 6" },
                  { icon: "chef", label: "Hosted by Linh" },
                ].map((x, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.92rem" }}>
                    <div style={{ color: "var(--red)" }}><Icon name={x.icon} size={18}/></div>
                    <span>{x.label}</span>
                  </div>
                ))}
              </div>
              <a className="btn btn-primary" onClick={() => openTrip("hanoi-street-food")}>
                See this trip <Icon name="arrow" size={18}/>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background: "var(--ink)", color: "var(--cream)", padding: "80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="eyebrow" style={{ color: "var(--yellow)" }}>How it works</span>
            <h2 style={{ color: "var(--cream)", marginBottom: 12 }}>Three steps. Zero stress.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { num: "01", title: "Book it", body: "Pick a trip, fill the Vibe Check, pay half upfront.", color: "var(--red)" },
              { num: "02", title: "Pack your bags", body: "We WhatsApp you everything you need — what to wear, what to leave behind.", color: "var(--yellow)" },
              { num: "03", title: "Eat everything", body: "Show up hungry. We handle the rest. Bring an empty memory card.", color: "var(--green)" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,.04)", padding: "32px 28px", borderRadius: "var(--r-lg)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 500, color: s.color, lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                <h3 style={{ color: "var(--cream)", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ opacity: 0.75, fontSize: "0.95rem" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR TRIPS */}
      <section className="section">
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <span className="eyebrow">Our most-booked</span>
              <h2>Trips travelers can't stop talking about.</h2>
            </div>
            <a className="btn btn-ghost" onClick={() => go("trips")}>See all trips <Icon name="arrow" size={16}/></a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {TRIPS.slice(0, 3).map(t => (
              <TripCard key={t.id} trip={t} onClick={() => openTrip(t.id)}/>
            ))}
          </div>
        </div>
      </section>

      {/* WALL OF LOVE */}
      <section className="section" style={{ background: "var(--cream-warm)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="eyebrow">Wall of love</span>
            <h2>Bragging rights, straight from our guests.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: "var(--white)", padding: 22, borderRadius: "var(--r-lg)",
                boxShadow: "var(--shadow-sm)",
                transform: i % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)",
              }}>
                <div className={phClass(`insta-${(i % 4) + 1}`, `ph ${t.color}`)} style={{ height: 180, borderRadius: "var(--r-md)", marginBottom: 14, ...photo(`insta-${(i % 4) + 1}`) }}>
                  <span className="ph-label">insta post</span>
                </div>
                <p style={{ fontSize: "0.92rem", marginBottom: 14, lineHeight: 1.5 }}>"{t.quote}"</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ color: "var(--ink-soft)" }}>{t.handle}</div>
                  </div>
                  <Icon name="instagram" size={18}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEAD MAGNET */}
      <section className="section">
        <div className="container">
          <div style={{
            background: "linear-gradient(135deg, var(--red) 0%, var(--red-deep) 100%)",
            borderRadius: "var(--r-xl)", padding: "56px 64px",
            display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48, alignItems: "center",
            color: "var(--white)", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,210,0,.15)" }}/>
            <div style={{ position: "absolute", bottom: -60, right: 120, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,210,0,.1)" }}/>
            <div style={{ position: "relative" }}>
              <span className="badge badge-yellow" style={{ marginBottom: 16 }}>Free · 12-page PDF</span>
              <h2 style={{ color: "var(--white)", marginBottom: 14 }}>The Hanoi Street Food Map.</h2>
              <p style={{ opacity: 0.9, marginBottom: 24, fontSize: "1.02rem" }}>
                Every bún chả, bánh mì, and egg coffee spot we actually eat at. Numbered, mapped, ranked, and updated every month.
              </p>
              <div style={{ display: "flex", gap: 10, maxWidth: 440 }}>
                <input className="input lead-input" placeholder="your@email.com" style={{ background: "rgba(255,255,255,.95)", borderColor: "rgba(255,255,255,.95)", color: "var(--ink)" }}/>
                <button className="btn btn-yellow">Send me the map</button>
              </div>
            </div>
            <div className={phClass("pdf", "ph yellow")} style={{ height: 280, borderRadius: "var(--r-lg)", transform: "rotate(3deg)", boxShadow: "var(--shadow-lg)", ...photo("pdf") }}>
              <span className="ph-label">PDF mockup</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const TRIP_PHOTO_MAP = {
  "hanoi-street-food": "pho-shop",
  "ha-giang-loop": "ha-giang",
  "hoi-an-lantern": "hoi-an",
  "mekong-homestay": "mekong",
  "sapa-trek": "sapa",
  "saigon-vespa": "vespa",
};

/* Reusable trip card */
const TripCard = ({ trip, onClick }) => {
  const key = TRIP_PHOTO_MAP[trip.id];
  return (
  <div className="card" onClick={onClick} style={{ cursor: "pointer" }}>
    <div className={phClass(key, `ph ${trip.color}`)} style={{ height: 220, borderRadius: 0, position: "relative", ...photo(key) }}>
      <span className="ph-label">{trip.title.toLowerCase()}</span>
      {trip.staff && (
        <div style={{ position: "absolute", top: 14, left: 14, background: "var(--yellow)", color: "var(--ink)", padding: "6px 12px", borderRadius: "var(--r-pill)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.05, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="sparkle" size={12}/> Staff pick
        </div>
      )}
      <div style={{ position: "absolute", top: 14, right: 14, background: "var(--white)", padding: "6px 12px", borderRadius: "var(--r-pill)", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
        <Icon name="star" size={13}/> {trip.rating}
      </div>
    </div>
    <div style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
        <span className={`badge badge-${trip.color === "ink" ? "ink" : trip.color}`}>{trip.tag}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.82rem", color: "var(--ink-soft)" }}>
          <Icon name="clock" size={14}/> {trip.duration}
        </div>
      </div>
      <h3 style={{ marginBottom: 6, fontSize: "1.2rem" }}>{trip.title}</h3>
      <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
        <Icon name="pin" size={14}/> {trip.location}
      </div>
      <p style={{ fontSize: "0.9rem", color: "var(--ink-soft)", marginBottom: 18, minHeight: "2.6em" }}>{trip.short}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <div>
          <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: 0.05 }}>From</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.3rem" }}>${trip.price}</div>
        </div>
        <div className="btn btn-primary" style={{ padding: "10px 18px", fontSize: "0.88rem" }}>
          Book now <Icon name="arrow" size={14}/>
        </div>
      </div>
    </div>
  </div>
  );
};

window.TRIP_PHOTO_MAP = TRIP_PHOTO_MAP;

window.Home = Home;
window.TripCard = TripCard;
