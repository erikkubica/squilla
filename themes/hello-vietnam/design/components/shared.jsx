/* Shared components & data for Hello Vietnam Adventures */

const TRIPS = [
  {
    id: "hanoi-street-food",
    title: "Hanoi Street Food Safari",
    tag: "Foodie",
    duration: "4 hrs",
    price: 45,
    location: "Hanoi Old Quarter",
    rating: 4.9,
    reviews: 312,
    staff: true,
    color: "red",
    short: "Plastic stools, bubbling pots, and twelve things you've never eaten before.",
    stops: ["Bun Cha lunch with a grandma", "Egg coffee pitstop", "Banh Mi queen of Hanoi", "Night-market dessert crawl"],
  },
  {
    id: "ha-giang-loop",
    title: "Ha Giang Motorbike Loop",
    tag: "Adventure",
    duration: "4 days",
    price: 320,
    location: "Northern Highlands",
    rating: 4.95,
    reviews: 187,
    color: "green",
    short: "Three mountain passes, one unforgettable homestay, zero tourist buses.",
    stops: ["Quan Ba Heaven's Gate", "Ma Pi Leng Pass sunset", "Lung Cu flag point", "Hmong village homestay"],
  },
  {
    id: "hoi-an-lantern",
    title: "Hoi An Lantern Cooking Class",
    tag: "Foodie",
    duration: "5 hrs",
    price: 68,
    location: "Hoi An",
    rating: 4.85,
    reviews: 241,
    color: "yellow",
    short: "Market, boat, kitchen, feast. A full sensory dive into Central cuisine.",
    stops: ["Sunrise market tour", "Basket-boat paddle", "Hands-on kitchen", "Lantern-lit riverside dinner"],
  },
  {
    id: "mekong-homestay",
    title: "Mekong Delta Homestay",
    tag: "Relaxing",
    duration: "2 days",
    price: 140,
    location: "Ben Tre",
    rating: 4.8,
    reviews: 156,
    color: "green",
    short: "Coconut candy, river hammocks, and a slower kind of south.",
    stops: ["Floating market dawn", "Coconut workshop", "Sampan through the canals", "Family-style dinner"],
  },
  {
    id: "sapa-trek",
    title: "Sapa Rice Terrace Trek",
    tag: "Adventure",
    duration: "3 days",
    price: 220,
    location: "Sapa",
    rating: 4.88,
    reviews: 203,
    color: "green",
    short: "Knee-deep in clouds and rice paddies with a local H'Mong guide.",
    stops: ["Cat Cat village", "Muong Hoa valley hike", "Ta Van homestay", "Fansipan viewpoint"],
  },
  {
    id: "saigon-vespa",
    title: "Saigon by Vespa, After Dark",
    tag: "Foodie",
    duration: "5 hrs",
    price: 78,
    location: "Ho Chi Minh City",
    rating: 4.92,
    reviews: 421,
    color: "red",
    short: "Six districts, four stops, one cold beer in your helmet hand.",
    stops: ["District 4 seafood alley", "Rooftop sunset beer", "Live-music hideout", "Che dessert finale"],
  },
];

const TESTIMONIALS = [
  { name: "Maya R.", handle: "@mayawanders", trip: "Hanoi Street Food Safari", quote: "I came for the pho. I left with a second family in the Old Quarter.", color: "red" },
  { name: "Ben & Lila", handle: "@benandlila", trip: "Ha Giang Loop", quote: "Our guide Tuan made us feel like we were visiting cousins, not customers.", color: "yellow" },
  { name: "Priya K.", handle: "@priyaeats", trip: "Hoi An Cooking Class", quote: "Hands-down the tastiest day of our whole South-east Asia trip.", color: "green" },
  { name: "The Ortiz Family", handle: "@ortiz5abroad", trip: "Mekong Homestay", quote: "Kids still talk about the coconut candy lady. Three months later.", color: "red" },
];

const CREW = [
  { name: "Linh Tran", role: "Founder & Head Guide", based: "Hanoi", fun: "Banh Mi 25, Hang Ca St.", color: "red" },
  { name: "Tuan Pham", role: "Ha Giang Lead", based: "Dong Van", fun: "Still has his first Honda Win.", color: "green" },
  { name: "Mai Nguyen", role: "Hoi An Kitchen Chief", based: "Hoi An", fun: "Grows her own Thai basil.", color: "yellow" },
  { name: "Dat Le", role: "Saigon Night Owl", based: "District 4", fun: "Knows every late-night pho spot.", color: "red" },
  { name: "Huong Vu", role: "Trip Planner", based: "Hanoi", fun: "Speaks 4 languages + sarcasm.", color: "green" },
  { name: "Ben Carter", role: "Content & Comms", based: "Da Nang", fun: "Aussie who moved for the beach.", color: "yellow" },
];

const FAQS = [
  { q: "Do I need a visa?", a: "Most nationalities get 45-day visa-free entry. We'll send you a checklist once you book — and a WhatsApp nudge if you forget." },
  { q: "Is this vegetarian-friendly?", a: "Absolutely. Vietnam is one of the easiest countries in Asia for plant-based travelers. Just flag it on the booking form and we'll adjust every stop." },
  { q: "What's your cancellation policy?", a: "Full refund up to 7 days before. 50% within 7 days. We're humans — if something serious happens, talk to us." },
  { q: "How fit do I need to be?", a: "Depends on the trip. Street food safaris are easy walks. Ha Giang and Sapa need baseline stamina. Each trip page lists a difficulty level." },
];

/* ---- Icons (inline SVG, consistent stroke, rounded) ---- */
const Icon = ({ name, size = 22 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    food: <><path d="M5 3v8a3 3 0 0 0 3 3v7"/><path d="M19 3l-2 8a2 2 0 0 0 2 2v8"/><path d="M5 3h3v8"/></>,
    trail: <><path d="M3 20l4-10 4 6 3-4 7 8"/><circle cx="7" cy="6" r="2"/></>,
    workshop: <><path d="M4 21h16"/><path d="M6 21V10l6-4 6 4v11"/><path d="M10 21v-6h4v6"/></>,
    family: <><circle cx="8" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 21v-2a5 5 0 0 1 10 0v2"/><path d="M13 21v-1a4 4 0 0 1 8 0v1"/></>,
    map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    star: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>,
    arrow: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    heart: <path d="M12 21s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 11-8 11z" transform="translate(-1 0)"/>,
    check: <path d="M4 12l5 5 11-11"/>,
    x: <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor"/></>,
    tiktok: <><path d="M16 3v11a4 4 0 1 1-4-4"/><path d="M16 3a4 4 0 0 0 4 4"/></>,
    whatsapp: <><path d="M21 12a9 9 0 1 1-4.2-7.6L21 3l-1.4 4.2A9 9 0 0 1 21 12z"/><path d="M8 11c.5 2 2 3.5 4 4l1.5-1.5 2.5 1-1 2.5c-4 .5-7.5-3-8-7L9.5 8 10.5 11z"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></>,
    phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>,
    pin: <><path d="M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></>,
    filter: <path d="M4 5h16l-6 8v5l-4 2v-7z"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></>,
    chef: <><path d="M6 14h12v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path d="M6 14a4 4 0 1 1 3-6 4 4 0 0 1 6 0 4 4 0 1 1 3 6"/></>,
    leaf: <><path d="M20 4c-8 0-14 4-14 12 0 2 1 4 4 4 8 0 10-6 10-16z"/><path d="M6 20c4-4 7-7 14-16"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

/* ---- Nav ---- */
const Nav = ({ page, go }) => {
  const items = [
    ["home", "Home"],
    ["about", "About"],
    ["trips", "Trips"],
    ["gallery", "Gallery"],
    ["contact", "Contact"],
  ];
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a className="logo" onClick={() => go("home")}>
          <span className="logo-mark"></span>
          <span>Hello <span style={{ color: "var(--red)" }}>Vietnam</span></span>
        </a>
        <div className="nav-links">
          {items.map(([id, label]) => (
            <a key={id} className={`nav-link ${page === id ? "active" : ""}`} onClick={() => go(id)}>{label}</a>
          ))}
        </div>
        <a className="nav-cta" onClick={() => go("trips")}>Find Your Adventure →</a>
      </div>
    </nav>
  );
};

/* ---- Footer ---- */
const Footer = ({ go }) => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <div className="logo" style={{ color: "var(--cream)", marginBottom: 16 }}>
            <span className="logo-mark"></span>
            <span>Hello Vietnam</span>
          </div>
          <p style={{ opacity: 0.7, fontSize: "0.92rem", maxWidth: 320, marginBottom: 20 }}>
            Small-group, locally-guided adventures across Vietnam. Zero tourist traps, maximum laughter.
          </p>
          <div className="socials">
            <a className="social-ico"><Icon name="instagram" size={18}/></a>
            <a className="social-ico"><Icon name="tiktok" size={18}/></a>
            <a className="social-ico"><Icon name="whatsapp" size={18}/></a>
            <a className="social-ico"><Icon name="mail" size={18}/></a>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><a onClick={() => go("trips")}>All Trips</a></li>
            <li><a onClick={() => go("gallery")}>Gallery</a></li>
            <li><a onClick={() => go("about")}>Our Story</a></li>
            <li><a onClick={() => go("contact")}>Custom Journey</a></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li><a onClick={() => go("contact")}>Contact</a></li>
            <li><a>Booking FAQ</a></li>
            <li><a>Travel Insurance</a></li>
            <li><a onClick={() => go("legal")}>Privacy</a></li>
          </ul>
        </div>
        <div>
          <h4>Stay in Touch</h4>
          <p style={{ opacity: 0.7, fontSize: "0.88rem", marginBottom: 14 }}>
            Monthly recipes, photo dumps, and trip drops.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="input" placeholder="you@email.com" style={{ background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.2)", color: "var(--cream)" }}/>
            <button className="btn btn-yellow" style={{ justifyContent: "center", padding: "12px 16px" }}>Subscribe</button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Hello Vietnam Adventures. Crafted with nước mắm in Hanoi.</span>
        <span>Registered tour operator · License #HN-2021-0847</span>
      </div>
    </div>
  </footer>
);

window.Icon = Icon;
window.Nav = Nav;
window.Footer = Footer;
window.TRIPS = TRIPS;
window.TESTIMONIALS = TESTIMONIALS;
window.CREW = CREW;
window.FAQS = FAQS;
