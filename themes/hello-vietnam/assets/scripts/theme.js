// Hello Vietnam theme interactions — mirrors the React prototype behaviors.
(function () {
  "use strict";

  // Trips filter (Trips listing page): pills + search filter .trip-card grid items by data-tag / data-title / data-location.
  function initTripsFilter() {
    var root = document.querySelector("[data-trips-root]");
    if (!root) return;
    var pills = root.querySelectorAll("[data-trip-pill]");
    var searchInput = root.querySelector("[data-trip-search]");
    var grid = root.querySelector("[data-trip-grid]");
    var cards = grid ? grid.querySelectorAll("[data-trip-card]") : [];
    var staffPick = document.querySelector("[data-staff-pick]");
    var countEl = document.querySelector("[data-trip-count]");
    var emptyEl = document.querySelector("[data-trip-empty]");
    var state = { tag: "All", q: "" };

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var tag = c.getAttribute("data-tag") || "";
        var title = (c.getAttribute("data-title") || "").toLowerCase();
        var loc = (c.getAttribute("data-location") || "").toLowerCase();
        var q = state.q.trim().toLowerCase();
        var tagOK = state.tag === "All" || tag === state.tag;
        var qOK = !q || title.indexOf(q) !== -1 || loc.indexOf(q) !== -1;
        if (tagOK && qOK) { c.style.display = ""; shown++; } else { c.style.display = "none"; }
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? " trip" : " trips");
      if (emptyEl) emptyEl.style.display = shown === 0 ? "" : "none";
      if (staffPick) staffPick.style.display = (state.tag === "All" && !state.q.trim()) ? "" : "none";
    }

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        state.tag = pill.getAttribute("data-trip-pill") || "All";
        apply();
      });
    });
    if (searchInput) {
      searchInput.addEventListener("input", function () { state.q = searchInput.value; apply(); });
    }
    apply();
  }

  // Accordion rows (itinerary, FAQs): each [data-accordion] toggles an [data-accordion-panel] sibling.
  function initAccordions() {
    document.querySelectorAll("[data-accordion]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var wrap = btn.closest("[data-accordion-row]");
        if (!wrap) return;
        wrap.classList.toggle("is-open");
      });
    });
  }

  // Gallery filter pills + lightbox.
  function initGallery() {
    var root = document.querySelector("[data-gallery-root]");
    if (!root) return;
    var pills = root.querySelectorAll("[data-gallery-pill]");
    var tiles = root.querySelectorAll("[data-gallery-tile]");
    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        var cat = pill.getAttribute("data-gallery-pill") || "All";
        tiles.forEach(function (t) {
          var tc = t.getAttribute("data-category") || "";
          t.style.display = (cat === "All" || tc === cat) ? "" : "none";
        });
      });
    });

    var lightbox = document.querySelector("[data-lightbox]");
    var lightboxImg = lightbox ? lightbox.querySelector("[data-lightbox-img]") : null;
    tiles.forEach(function (tile) {
      tile.style.cursor = "zoom-in";
      tile.addEventListener("click", function () {
        if (!lightbox) return;
        var bg = tile.getAttribute("data-bg") || tile.style.backgroundImage || "";
        var cls = tile.getAttribute("data-ph-variant") || "yellow";
        if (lightboxImg) {
          lightboxImg.className = "ph " + cls + " has-photo";
          lightboxImg.style.backgroundImage = bg;
        }
        lightbox.classList.add("is-open");
      });
    });
    if (lightbox) {
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox || e.target.hasAttribute("data-lightbox-close")) {
          lightbox.classList.remove("is-open");
        }
      });
    }
  }

  // Booking form: stepper ± buttons, live total, submit → success state.
  function initBooking() {
    var card = document.querySelector("[data-booking-card]");
    if (!card) return;
    var price = parseFloat(card.getAttribute("data-price") || "0");
    var adultsInput = card.querySelector("[data-adults]");
    var kidsInput = card.querySelector("[data-kids]");
    var totalEl = card.querySelector("[data-total]");

    function recalc() {
      var a = parseInt(adultsInput ? adultsInput.value : "1", 10) || 0;
      var k = parseInt(kidsInput ? kidsInput.value : "0", 10) || 0;
      var total = price * a + price * 0.5 * k;
      if (totalEl) totalEl.textContent = "$" + total.toFixed(0);
    }
    card.querySelectorAll("[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = btn.getAttribute("data-step");
        var delta = parseInt(btn.getAttribute("data-delta") || "0", 10);
        var input = card.querySelector("[data-" + target + "]");
        if (!input) return;
        var v = parseInt(input.value, 10) || 0;
        var min = parseInt(input.getAttribute("min") || "0", 10);
        v = Math.max(min, v + delta);
        input.value = v;
        recalc();
      });
    });
    [adultsInput, kidsInput].forEach(function (i) { if (i) i.addEventListener("input", recalc); });
    recalc();

    var form = card.querySelector("form");
    var success = card.querySelector("[data-booking-success]");
    var body = card.querySelector("[data-booking-body]");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var fn = (form.querySelector("[name=firstName]") || {}).value;
        var em = (form.querySelector("[name=email]") || {}).value;
        if (!fn || !em) return;
        if (body) body.style.display = "none";
        if (success) success.style.display = "";
      });
    }
    var again = card.querySelector("[data-booking-again]");
    if (again) {
      again.addEventListener("click", function () {
        if (body) body.style.display = "";
        if (success) success.style.display = "none";
      });
    }
  }

  // Contact form: submit → success.
  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    var success = document.querySelector("[data-contact-success]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = (form.querySelector("[name=name]") || {}).value;
      var em = (form.querySelector("[name=email]") || {}).value;
      if (!n || !em) return;
      form.style.display = "none";
      if (success) success.style.display = "";
    });
    var again = document.querySelector("[data-contact-again]");
    if (again) {
      again.addEventListener("click", function () {
        form.style.display = "";
        if (success) success.style.display = "none";
        form.reset();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initTripsFilter(); initAccordions(); initGallery(); initBooking(); initContactForm();
    });
  } else {
    initTripsFilter(); initAccordions(); initGallery(); initBooking(); initContactForm();
  }
})();
