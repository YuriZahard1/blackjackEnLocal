/**
 * dashboard.js — index.html
 * Renderizado dinámico de las tarjetas a partir de mockData.js + partidas del usuario,
 * con buscador y filtros en tiempo real y estadísticas.
 */
(function (BJ) {
  "use strict";
  if (BJ.redirecting) return;

  var allMatches = BJ.getAllMatches(BJ.session);
  var ownMatches = BJ.loadMatches(BJ.session);

  var grid = document.getElementById("match-grid");
  var emptyState = document.getElementById("empty-state");
  var live = document.getElementById("live-status");
  var search = document.getElementById("search");
  var template = document.getElementById("match-card-template");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var resetButton = document.getElementById("reset-filters");

  var query = "";
  var filter = "all";

  // ───────── Cabecera del resumen y estadísticas ─────────
  document.getElementById("session-title").textContent = BJ.isGuest ? "Resumen de la sesión" : "Resumen de tu cuenta";
  document.getElementById("session-note").textContent = BJ.isGuest
    ? "Modo invitado: tus datos se borrarán al cerrar la sesión."
    : "Tus partidas se guardan en este navegador.";

  function countBy(result) {
    return ownMatches.filter(function (match) { return match.result === result; }).length;
  }
  document.querySelector('[data-stat="total"]').textContent = ownMatches.length;
  document.querySelector('[data-stat="wins"]').textContent = countBy("Victoria");
  document.querySelector('[data-stat="losses"]').textContent = countBy("Derrota");
  document.querySelector('[data-stat="draws"]').textContent = countBy("Empate");

  // ───────── Tarjetas (clonando la <template> del HTML) ─────────
  function handsText(n) {
    return n + " " + (n === 1 ? "mano" : "manos");
  }

  function buildCard(match) {
    var card = template.content.firstElementChild.cloneNode(true);
    var set = function (field, text) { card.querySelector('[data-field="' + field + '"]').textContent = text; };

    card.querySelector(".badge").classList.add("badge--" + BJ.TONES[match.result]);
    set("result", match.result);
    set("date", BJ.formatMatchDate(match.playedAt) + (match.example ? " · Ejemplo" : ""));
    set("name", match.name);
    set("player", match.playerScore);
    set("dealer", match.dealerScore);
    set("hands", handsText(match.hands));
    card.querySelector('[data-field="link"]').href = "pages/detalle.html?id=" + encodeURIComponent(match.id);
    return card;
  }

  // ───────── Filtrado en tiempo real ─────────
  function render() {
    filterButtons.forEach(function (btn) {
      var active = btn.dataset.filter === filter;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    var term = query.trim().toLowerCase();
    var visible = allMatches.filter(function (match) {
      var matchesFilter = filter === "all" || match.result === filter;
      return matchesFilter && match.name.toLowerCase().includes(term);
    });

    grid.replaceChildren.apply(grid, visible.map(buildCard));
    grid.hidden = visible.length === 0;
    emptyState.hidden = visible.length > 0;
    live.textContent = "Mostrando " + visible.length + " de " + allMatches.length + " partidas";
  }

  search.addEventListener("input", function () {
    query = search.value;
    render();
  });

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filter = btn.dataset.filter;
      render();
    });
  });

  resetButton.addEventListener("click", function () {
    query = "";
    filter = "all";
    search.value = "";
    render();
  });

  render();
})(window.BJ = window.BJ || {});
