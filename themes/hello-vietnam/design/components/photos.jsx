/* Photo helper — maps image-key → Unsplash URL.
   Unsplash source URLs allow direct hot-linking. */
const PHOTOS = {
  "hero-hanoi":     "https://images.unsplash.com/photo-1528127269322-539801943592?w=1400&q=80",
  "rice-terrace":   "https://images.unsplash.com/photo-1528181304800-259b08848526?w=900&q=80",
  "tea":            "https://images.unsplash.com/photo-1566827904577-0e72bce52acb?w=600&q=80",
  "pho-shop":       "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1100&q=80",
  "banh-mi":        "https://images.unsplash.com/photo-1600454793089-f71e2c3a65a9?w=900&q=80",
  "ha-giang":       "https://images.unsplash.com/photo-1557750255-c76072a7fdf1?w=900&q=80",
  "mekong":         "https://images.unsplash.com/photo-1540459180209-1f2e0a4ed900?w=900&q=80",
  "hoi-an":         "https://images.unsplash.com/photo-1528181304800-259b08848526?w=900&q=80",
  "sapa":           "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900&q=80",
  "vespa":          "https://images.unsplash.com/photo-1583417267826-aebc4d1c8eb2?w=900&q=80",
  "lantern":        "https://images.unsplash.com/photo-1540870089-38b9bc16dcbd?w=900&q=80",
  "street-1":       "https://images.unsplash.com/photo-1583077874340-79db6564638e?w=600&q=80",
  "street-2":       "https://images.unsplash.com/photo-1562953905-2a1fa4b0b1e9?w=600&q=80",
  "people-1":       "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80",
  "people-2":       "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80",
  "landscape-1":    "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80",
  "landscape-2":    "https://images.unsplash.com/photo-1557750255-c76072a7fdf1?w=600&q=80",
  "workshop-1":     "https://images.unsplash.com/photo-1540870089-38b9bc16dcbd?w=600&q=80",
  "workshop-2":     "https://images.unsplash.com/photo-1566827904577-0e72bce52acb?w=600&q=80",
  "night-market":   "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80",
  "team":           "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80",
  "village-school": "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=900&q=80",
  "map":            "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900&q=80",
  "pdf":            "https://images.unsplash.com/photo-1557750255-c76072a7fdf1?w=700&q=80",
  "portrait-1":     "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  "portrait-2":     "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "portrait-3":     "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  "portrait-4":     "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  "portrait-5":     "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  "portrait-6":     "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
  "insta-1":        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80",
  "insta-2":        "https://images.unsplash.com/photo-1557750255-c76072a7fdf1?w=500&q=80",
  "insta-3":        "https://images.unsplash.com/photo-1540870089-38b9bc16dcbd?w=500&q=80",
  "insta-4":        "https://images.unsplash.com/photo-1528181304800-259b08848526?w=500&q=80",
};

window.PHOTOS = PHOTOS;
window.photo = (k) => PHOTOS[k] ? { backgroundImage: `url(${PHOTOS[k]})` } : {};
window.phClass = (k, base = "ph") => PHOTOS[k] ? `${base} has-photo` : base;
