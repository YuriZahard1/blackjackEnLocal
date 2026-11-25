/**
 * crear.js — crear.html
 * Formulario de inserción: registrar una partida. Validación en tiempo real y modal de confirmación.
 */
(function (BJ) {
  "use strict";
  if (BJ.redirecting) return;

  var form = document.getElementById("create-form");
  var validation = BJ.initForm(form);
  var f = form.elements;

  function setDefaults() {
    f.date.max = BJ.todayISO();
    f.date.value = BJ.todayISO();
  }
  setDefaults();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validation.validateAll()) return;

    // La fecha se guarda con la hora actual para ordenar bien las partidas del mismo día.
    var day = new Date(f.date.value + "T00:00:00");
    var now = new Date();
    day.setHours(now.getHours(), now.getMinutes(), 0, 0);

    var match = BJ.addMatch(BJ.session, {
      name: f.name.value.trim(),
      playedAt: day.getTime(),
      result: f.result.value,
      playerScore: Number(f.playerScore.value),
      dealerScore: Number(f.dealerScore.value),
      hands: Number(f.hands.value),
      decks: Number(f.decks.value),
      notes: f.notes.value.trim(),
      source: "manual",
    });

    BJ.openModal({
      title: "Partida guardada",
      body: BJ.h("p", {}, "«" + match.name + "» se ha añadido a tu historial."),
      actions: [
        {
          label: "Registrar otra",
          variant: "secondary",
          onClick: function () { validation.reset(); setDefaults(); f.name.focus(); },
        },
        { label: "Ver detalle", onClick: function () { BJ.go("pages/detalle.html?id=" + encodeURIComponent(match.id)); } },
      ],
    });
  });
})(window.BJ = window.BJ || {});
