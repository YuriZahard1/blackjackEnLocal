/**
 * detalle.js — detalle.html?id=...
 * Ficha detallada de una partida: se lee el id de la URL y se pinta desde los datos.
 */
(function (BJ) {
  "use strict";
  if (BJ.redirecting) return;

  var id = new URLSearchParams(window.location.search).get("id");
  var match = id ? BJ.findMatch(BJ.session, id) : null;

  var detail = document.getElementById("detail");
  var notFound = document.getElementById("not-found");

  if (!match) {
    detail.hidden = true;
    notFound.hidden = false;
    document.title = "Partida no encontrada · Veintiuno";
    return;
  }

  var set = function (field, text) {
    document.querySelectorAll('[data-field="' + field + '"]').forEach(function (node) { node.textContent = text; });
  };

  document.title = match.name + " · Veintiuno";
  set("name", match.name);
  set("result", match.result);
  set("date", BJ.formatMatchDate(match.playedAt));
  set("player", match.playerScore);
  set("dealer", match.dealerScore);
  set("hands", match.hands);
  set("decks", match.decks || 6);
  set("origin", match.example ? "Dato de ejemplo" : match.source === "manual" ? "Registrada a mano" : "Jugada en la mesa");
  document.querySelector(".badge").classList.add("badge--" + BJ.TONES[match.result]);

  var note = document.getElementById("detail-note");
  if (match.notes) set("notes", match.notes);
  else note.hidden = true;

  // Solo se pueden eliminar las partidas propias (no los datos de ejemplo).
  var deleteButton = document.getElementById("delete-match");
  if (match.example) {
    deleteButton.hidden = true;
    document.getElementById("example-note").hidden = false;
  }

  deleteButton.addEventListener("click", function () {
    BJ.openModal({
      title: "¿Eliminar esta partida?",
      body: BJ.h("p", {}, "«" + match.name + "» se borrará de tu historial y no se podrá recuperar."),
      actions: [
        { label: "Cancelar", variant: "secondary" },
        {
          label: "Eliminar",
          variant: "danger",
          onClick: function () {
            BJ.deleteMatch(BJ.session, match.id);
            BJ.go("index.html");
          },
        },
      ],
    });
  });
})(window.BJ = window.BJ || {});
