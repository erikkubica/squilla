// Curriculum Vitae theme — interactive bits (now-tabs, stack-tabs, xp accordion).
(function () {
  "use strict";

  function initNowTabs() {
    document.querySelectorAll("[data-now-root]").forEach(function (root) {
      var tabs = root.querySelectorAll("[data-now-tab]");
      var panels = root.querySelectorAll("[data-now-panel]");
      tabs.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-now-tab");
          tabs.forEach(function (t) { t.classList.toggle("on", t === btn); });
          panels.forEach(function (p) {
            p.classList.toggle("on", p.getAttribute("data-now-panel") === key);
          });
        });
      });
    });
  }

  function initStackTabs() {
    document.querySelectorAll("[data-stack-root]").forEach(function (root) {
      var tabs = root.querySelectorAll("[data-stack-tab]");
      var groups = root.querySelectorAll("[data-stack-group]");
      tabs.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-stack-tab");
          tabs.forEach(function (t) { t.classList.toggle("on", t === btn); });
          groups.forEach(function (g) {
            g.classList.toggle("on", g.getAttribute("data-stack-group") === key);
          });
        });
      });
    });
  }

  function initExperience() {
    document.querySelectorAll("[data-xp-list]").forEach(function (list) {
      var items = list.querySelectorAll("[data-xp-item]");
      items.forEach(function (li) {
        li.addEventListener("click", function () {
          var isOn = li.classList.contains("on");
          items.forEach(function (other) { other.classList.remove("on"); });
          if (!isOn) li.classList.add("on");
        });
      });
    });
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    initNowTabs();
    initStackTabs();
    initExperience();
  });
})();
