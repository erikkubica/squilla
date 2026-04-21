/* Trips listing + Trip detail */

const Trips = ({ openTrip }) => {
  const [filter, setFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");
  const tags = ["All", "Foodie", "Adventure", "Relaxing"];
  const list = TRIPS.filter(t =>
    (filter === "All" || t.tag === filter) &&
    (!search || t.title.toLowerCase().includes(search.toLowerCase()) || t.location.toLowerCase().includes(search.toLowerCase()))
  );
  const staffPick = TRIPS.find(t => t.staff);

  return (
    <div className="page-enter">
      <section style={{ padding: "48px 0 24px", background: "var(--cream-warm)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <span className="eyebrow">All trips</span>
            <h1 style={{ marginBottom: 12 }}>I'm looking for...</h1>
          </div>
          <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input className="input" placeholder="Search trips, places, vibes..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44, height: 52, fontSize: "1rem", borderRadius: "var(--r-pill)" }}/>
              <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "var(--ink-soft)" }}><Icon name="search" size={18}/></div>
            </div>
            <button className="btn btn-primary" style={{ height: 52 }}><Icon name="search" size={16}/> Search</button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
            {tags.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: "10px 20px", borderRadius: "var(--r-pill)",
                background: filter === t ? "var(--red)" : "var(--white)",
                color: filter === t ? "var(--white)" : "var(--ink)",
                border: `1.5px solid ${filter === t ? "var(--red)" : "var(--line)"}`,
                fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "0.9rem",
                transition: "all .15s",
              }}>{t}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Staff pick */}
      {filter === "All" && !search && (
        <section style={{ padding: "40px 0" }}>
          <div className="container">
            <div onClick={() => openTrip(staffPick.id)} style={{
              background: `linear-gradient(110deg, var(--${staffPick.color === "red" ? "red" : "green"}) 0%, var(--${staffPick.color === "red" ? "red-deep" : "green-deep"}) 100%)`,
              color: "var(--white)", borderRadius: "var(--r-xl)", overflow: "hidden",
              display: "grid", gridTemplateColumns: "1.1fr 1fr", cursor: "pointer",
              boxShadow: "var(--shadow-lg)",
            }}>
              <div style={{ padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span className="badge badge-yellow" style={{ width: "fit-content", marginBottom: 18 }}>
                  <Icon name="sparkle" size={12}/> #1 Staff Pick
                </span>
                <h2 style={{ color: "var(--white)", marginBottom: 14 }}>{staffPick.title}</h2>
                <p style={{ opacity: 0.9, marginBottom: 22, fontSize: "1.05rem" }}>{staffPick.short}</p>
                <div style={{ display: "flex", gap: 20, fontSize: "0.9rem", marginBottom: 26 }}>
                  <span><Icon name="clock" size={14}/> {staffPick.duration}</span>
                  <span><Icon name="pin" size={14}/> {staffPick.location}</span>
                  <span><Icon name="star" size={14}/> {staffPick.rating} ({staffPick.reviews})</span>
                </div>
                <button className="btn btn-yellow" style={{ width: "fit-content" }}>
                  See the trip — from ${staffPick.price} <Icon name="arrow" size={18}/>
                </button>
              </div>
              <div className={phClass(TRIP_PHOTO_MAP[staffPick.id], `ph ${staffPick.color}`)} style={{ borderRadius: 0, minHeight: 380, ...photo(TRIP_PHOTO_MAP[staffPick.id]) }}>
                <span className="ph-label">{staffPick.title.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section style={{ padding: "24px 0 40px" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontSize: "0.95rem", color: "var(--ink-soft)" }}>
              Showing <strong style={{ color: "var(--ink)" }}>{list.length}</strong> trip{list.length !== 1 ? "s" : ""}
            </div>
            <select className="select" style={{ width: "auto", padding: "8px 40px 8px 16px", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1.5L6 6.5L11 1.5' stroke='%235A6B7A' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}>
              <option>Sort: Most popular</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
              <option>Duration</option>
            </select>
          </div>
          {list.length === 0 ? (
            <div style={{ textAlign: "center", padding: 80, background: "var(--cream-warm)", borderRadius: "var(--r-lg)" }}>
              <h3>No trips match that search.</h3>
              <p style={{ color: "var(--ink-soft)", marginTop: 10 }}>Try a different vibe or reach out for a custom journey.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {list.map(t => <TripCard key={t.id} trip={t} onClick={() => openTrip(t.id)}/>)}
            </div>
          )}
        </div>
      </section>

      {/* Map */}
      <section className="section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
            <div>
              <span className="eyebrow">Where we roam</span>
              <h2 style={{ marginBottom: 16 }}>Across Vietnam, north to south.</h2>
              <p style={{ color: "var(--ink-soft)", marginBottom: 22 }}>
                Every pin is a real trip we run — from misty mountain loops in Hà Giang to floating-market dawns in the Mekong.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { region: "North", count: 7, color: "red" },
                  { region: "Central", count: 5, color: "yellow" },
                  { region: "South", count: 6, color: "green" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "var(--white)", borderRadius: "var(--r-md)", border: "1px solid var(--line)" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: `var(--${r.color})` }}/>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>{r.region} Vietnam</span>
                    <span style={{ marginLeft: "auto", color: "var(--ink-soft)", fontSize: "0.88rem" }}>{r.count} trips</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ph ink" style={{ height: 480, borderRadius: "var(--r-xl)", position: "relative", overflow: "hidden" }}>
              <span className="ph-label">interactive map of vietnam</span>
              {/* Decorative pins */}
              {[
                { top: "15%", left: "55%", c: "red" },
                { top: "22%", left: "48%", c: "red" },
                { top: "45%", left: "70%", c: "yellow" },
                { top: "52%", left: "65%", c: "yellow" },
                { top: "75%", left: "50%", c: "green" },
                { top: "82%", left: "42%", c: "green" },
              ].map((p, i) => (
                <div key={i} style={{ position: "absolute", top: p.top, left: p.left, width: 20, height: 20, borderRadius: "50%", background: `var(--${p.c})`, border: "3px solid var(--white)", boxShadow: "var(--shadow-md)", zIndex: 2 }}/>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Custom journey */}
      <section className="section-tight">
        <div className="container">
          <div style={{ background: "var(--yellow-soft)", borderRadius: "var(--r-xl)", padding: "48px 56px", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 360px" }}>
              <h2 style={{ marginBottom: 10 }}>Don't see it? Build it.</h2>
              <p style={{ color: "var(--ink)", fontSize: "1rem" }}>
                Tell us your dates, your crew, and your cravings. We'll design a private itinerary from scratch — usually within 48 hours.
              </p>
            </div>
            <button className="btn btn-primary">Plan a custom journey <Icon name="arrow" size={18}/></button>
          </div>
        </div>
      </section>
    </div>
  );
};

/* -------- TRIP DETAIL -------- */
const TripDetail = ({ tripId, go, openTrip }) => {
  const trip = TRIPS.find(t => t.id === tripId) || TRIPS[0];
  const [photo_i, setPhoto] = React.useState(0);
  const [openDay, setOpenDay] = React.useState(0);
  const [booking, setBooking] = React.useState({
    firstName: "", lastName: "", email: "", phone: "",
    date: "", adults: 2, kids: 0,
    diet: "None", level: "Beginner", vibe: "",
  });
  const [bookedDone, setBookedDone] = React.useState(false);

  const total = trip.price * booking.adults + (trip.price * 0.5) * booking.kids;

  return (
    <div className="page-enter">
      {/* Gallery hero */}
      <section style={{ padding: "32px 0 0" }}>
        <div className="container">
          <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginBottom: 16, display: "flex", gap: 8 }}>
            <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Home</a>
            <span>›</span>
            <a onClick={() => go("trips")} style={{ cursor: "pointer" }}>Trips</a>
            <span>›</span>
            <span style={{ color: "var(--ink)" }}>{trip.title}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, height: 520, marginBottom: 32 }}>
            <div className={phClass(TRIP_PHOTO_MAP[trip.id], `ph ${trip.color}`)} style={{ borderRadius: "var(--r-xl)", height: "100%", ...photo(TRIP_PHOTO_MAP[trip.id]) }}>
              <span className="ph-label">{trip.title.toLowerCase()} · photo {photo_i + 1}</span>
            </div>
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 12 }}>
              <div className={phClass("street-1", "ph yellow")} style={{ borderRadius: "var(--r-xl)", ...photo("street-1") }}>
                <span className="ph-label">photo 2</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className={phClass("landscape-2", "ph green")} style={{ borderRadius: "var(--r-xl)", ...photo("landscape-2") }}><span className="ph-label">3</span></div>
                <div className={phClass("banh-mi", "ph red")} style={{ borderRadius: "var(--r-xl)", position: "relative", ...photo("banh-mi") }}>
                  <span className="ph-label">+2 more</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Title + content/booking grid */}
      <section style={{ padding: "20px 0 60px" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 56, alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <span className={`badge badge-${trip.color === "ink" ? "ink" : trip.color}`}>{trip.tag}</span>
                <span className="badge badge-ink"><Icon name="clock" size={12}/> {trip.duration}</span>
                <span className="badge badge-ink"><Icon name="pin" size={12}/> {trip.location}</span>
                {trip.staff && <span className="badge badge-yellow"><Icon name="sparkle" size={12}/> Staff pick</span>}
              </div>
              <h1 style={{ marginBottom: 12 }}>{trip.title}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
                <div style={{ display: "flex", gap: 2, color: "var(--yellow)" }}>
                  {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={16}/>)}
                </div>
                <span style={{ fontWeight: 600 }}>{trip.rating}</span>
                <span style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>· {trip.reviews} reviews</span>
              </div>

              <h3 style={{ marginBottom: 12 }}>What to expect</h3>
              <p style={{ color: "var(--ink-soft)", marginBottom: 28, fontSize: "1.02rem" }}>
                {trip.short} You'll move in a group of 6 max, with a local guide who'll drag you through alleys the bus tours literally can't fit down. Come hungry. Bring a camera. Bring wipes.
              </p>

              {/* Itinerary accordion */}
              <h3 style={{ marginBottom: 14 }}>The itinerary</h3>
              <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 36 }}>
                {trip.stops.map((stop, i) => (
                  <div key={i}>
                    <button onClick={() => setOpenDay(openDay === i ? -1 : i)} style={{
                      width: "100%", padding: "18px 22px",
                      display: "flex", alignItems: "center", gap: 18, textAlign: "left",
                      background: openDay === i ? "var(--cream-warm)" : "var(--white)",
                      borderBottom: i < trip.stops.length - 1 ? "1px solid var(--line)" : "none",
                      transition: "background .15s",
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `var(--${trip.color === "ink" ? "ink" : trip.color})`, color: trip.color === "yellow" ? "var(--ink)" : "var(--white)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.9rem", flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.02rem" }}>{stop}</div>
                        <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>Stop {i + 1}</div>
                      </div>
                      <Icon name={openDay === i ? "minus" : "plus"} size={18}/>
                    </button>
                    {openDay === i && (
                      <div style={{ padding: "16px 22px 22px 76px", color: "var(--ink-soft)", fontSize: "0.94rem", background: "var(--cream-warm)", borderTop: "1px solid var(--line)" }}>
                        Full briefing: we meet at the start point 15 minutes early. Expect ~45 minutes here — time to snap photos, chat with the host, and get your first taste. Vegetarian swaps available. We'll flag any allergens before you take a bite.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Included / not */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 40 }}>
                <div>
                  <h3 style={{ marginBottom: 14, color: "var(--green-deep)" }}>What's included</h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                    {["All food & drinks", "Local guide", "Motorbike helmet", "Transport between stops", "Bottled water"].map((x, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.95rem" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--green)", color: "var(--white)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={14}/></div>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 style={{ marginBottom: 14, color: "var(--red-deep)" }}>Not included</h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                    {["Hotel pickup (5km+)", "Alcoholic drinks", "Travel insurance", "Tips for your guide"].map((x, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.95rem" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--cream-warm)", color: "var(--red-deep)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="x" size={12}/></div>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reviews */}
              <h3 style={{ marginBottom: 18 }}>What travelers say</h3>
              <div style={{ display: "grid", gap: 16, marginBottom: 40 }}>
                {TESTIMONIALS.slice(0, 3).map((t, i) => (
                  <div key={i} className="card" style={{ padding: 22, display: "flex", gap: 16 }}>
                    <div className={phClass(`portrait-${i+1}`, `ph ${t.color}`)} style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, ...photo(`portrait-${i+1}`) }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                        <strong>{t.name}</strong>
                        <div style={{ display: "flex", gap: 2, color: "var(--yellow)" }}>
                          {[1,2,3,4,5].map(j => <Icon key={j} name="star" size={13}/>)}
                        </div>
                      </div>
                      <p style={{ fontSize: "0.94rem", marginBottom: 6 }}>"{t.quote}"</p>
                      <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>Booked the {t.trip} · 2 months ago</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQs */}
              <h3 style={{ marginBottom: 12 }}>Quick FAQs</h3>
              <div>{FAQS.map((f, i) => <FAQ key={i} {...f}/>)}</div>
            </div>

            {/* BOOKING CARD */}
            <div style={{ position: "sticky", top: 100 }}>
              <div className="card" style={{ padding: 28 }}>
                {bookedDone ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div className="ph green" style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px" }}>
                      <div style={{ position: "relative", zIndex: 1, color: "var(--green-deep)" }}><Icon name="check" size={28}/></div>
                    </div>
                    <h3 style={{ marginBottom: 8 }}>You're in!</h3>
                    <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem", marginBottom: 18 }}>
                      Confirmation sent to <strong>{booking.email || "your email"}</strong>. We'll WhatsApp you within the hour.
                    </p>
                    <button className="btn btn-ghost" onClick={() => setBookedDone(false)}>Book another</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500 }}>${trip.price}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>per adult</div>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: 20 }}>Kids under 12 · 50% off</div>

                    <div style={{ display: "grid", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div className="field">
                          <label>First name</label>
                          <input className="input" value={booking.firstName} onChange={e => setBooking({...booking, firstName: e.target.value})}/>
                        </div>
                        <div className="field">
                          <label>Surname</label>
                          <input className="input" value={booking.lastName} onChange={e => setBooking({...booking, lastName: e.target.value})}/>
                        </div>
                      </div>
                      <div className="field">
                        <label>Email</label>
                        <input className="input" type="email" value={booking.email} onChange={e => setBooking({...booking, email: e.target.value})} placeholder="you@somewhere.com"/>
                      </div>
                      <div className="field">
                        <label>WhatsApp / Phone</label>
                        <input className="input" value={booking.phone} onChange={e => setBooking({...booking, phone: e.target.value})} placeholder="+84 ..."/>
                        <span className="hint">We use this to coordinate pickup — saves lives on trip day.</span>
                      </div>
                      <div className="field">
                        <label>Trip date</label>
                        <input className="input" type="date" value={booking.date} onChange={e => setBooking({...booking, date: e.target.value})}/>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Stepper label="Adults" value={booking.adults} onChange={v => setBooking({...booking, adults: v})} min={1}/>
                        <Stepper label="Kids (under 12)" value={booking.kids} onChange={v => setBooking({...booking, kids: v})} min={0}/>
                      </div>
                      <div className="field">
                        <label>Dietary needs</label>
                        <select className="select" value={booking.diet} onChange={e => setBooking({...booking, diet: e.target.value})}>
                          <option>None</option>
                          <option>Vegetarian</option>
                          <option>Vegan</option>
                          <option>Gluten-free</option>
                          <option>Allergies (specify below)</option>
                        </select>
                      </div>
                      {trip.tag === "Adventure" && (
                        <div className="field">
                          <label>Experience level</label>
                          <select className="select" value={booking.level} onChange={e => setBooking({...booking, level: e.target.value})}>
                            <option>Beginner cyclist / rider</option>
                            <option>Intermediate</option>
                            <option>Pro</option>
                          </select>
                        </div>
                      )}
                      <div className="field">
                        <label>The Vibe Check</label>
                        <textarea className="textarea" value={booking.vibe} onChange={e => setBooking({...booking, vibe: e.target.value})} placeholder="Any specific food you're dying to try? Or absolutely hate?" style={{ minHeight: 80 }}/>
                      </div>

                      <div style={{ padding: 16, background: "var(--cream-warm)", borderRadius: "var(--r-md)", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <div>
                          <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: 0.05 }}>Total</div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.4rem" }}>${total.toLocaleString()}</div>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", textAlign: "right" }}>
                          50% now<br/>50% on trip day
                        </div>
                      </div>

                      <button className="btn btn-primary" style={{ justifyContent: "center", width: "100%" }} onClick={() => {
                        if (booking.firstName && booking.email) setBookedDone(true);
                      }}>
                        Reserve my spot <Icon name="arrow" size={18}/>
                      </button>
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", textAlign: "center" }}>
                        Free cancellation up to 7 days before.
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ padding: 20, marginTop: 16, background: "var(--cream-warm)", borderRadius: "var(--r-lg)", display: "flex", alignItems: "center", gap: 12, fontSize: "0.88rem" }}>
                <Icon name="whatsapp" size={22}/>
                <div>Questions? <a style={{ textDecoration: "underline", cursor: "pointer" }}>WhatsApp us</a> — we reply fast.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="section-tight" style={{ background: "var(--cream-warm)" }}>
        <div className="container">
          <h2 style={{ marginBottom: 32 }}>You might also love...</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {TRIPS.filter(t => t.id !== trip.id).slice(0, 3).map(t => (
              <TripCard key={t.id} trip={t} onClick={() => openTrip(t.id)}/>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const Stepper = ({ label, value, onChange, min = 0 }) => (
  <div className="field">
    <label>{label}</label>
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--white)", border: "1.5px solid var(--line)", borderRadius: "var(--r-md)", padding: "4px 6px" }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--cream-warm)", display: "grid", placeItems: "center" }}><Icon name="minus" size={14}/></button>
      <div style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>{value}</div>
      <button onClick={() => onChange(value + 1)} style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--cream-warm)", display: "grid", placeItems: "center" }}><Icon name="plus" size={14}/></button>
    </div>
  </div>
);

window.Trips = Trips;
window.TripDetail = TripDetail;
