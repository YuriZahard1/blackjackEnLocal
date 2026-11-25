/**
 * jugar.js — jugar.html
 * Interfaz de la mesa de Blackjack: pedir, plantarse, doblar, dividir. Al terminar la ronda
 * guarda la partida en el historial (storage.js) y muestra un modal con el resultado.
 */
(function (BJ) {
  "use strict";
  if (BJ.redirecting) return;

  var h = BJ.h;
  var G = BJ.game;
  var sleep = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };

  var RESULT_LABEL = { win: "Victoria", loss: "Derrota", draw: "Empate" };
  var RESULT_TITLE = { win: "¡Has ganado!", loss: "Esta vez gana la banca", draw: "Empate" };
  var RESULT_TEXT = {
    win: "Una mano impecable. Has superado a la banca.",
    loss: "Buena partida. La próxima mano puede ser la tuya.",
    draw: "Misma puntuación. La ronda queda en tablas.",
  };
  var RESULT_ICON = { win: "21", loss: "♠", draw: "=" };
  var HAND_WORD = { win: "victoria", loss: "derrota", draw: "empate" };
  var DECKS = 6;

  var state = {
    shoe: [],
    hands: [],
    active: 0,
    dealer: [],
    phase: "player", // "player" | "dealer" | "done"
    finished: false,
    roundResult: null,
    handResults: [],
    label: "Tu turno",
    freshId: "",
  };
  var handId = 0;
  var resultTimer;
  var closeModal = null;

  // Elementos fijos del HTML (los botones no se recrean, así no se pierde el foco)
  var table = document.getElementById("table");
  var btnStand = document.getElementById("btn-stand");
  var btnDouble = document.getElementById("btn-double");
  var btnSplit = document.getElementById("btn-split");
  var btnHit = document.getElementById("btn-hit");
  var btnNew = document.getElementById("btn-new");
  var btnLeave = document.getElementById("btn-leave");

  function activeCards() {
    return state.hands[state.active] ? state.hands[state.active].cards : [];
  }
  function canDouble() {
    return state.phase === "player" && activeCards().length === 2;
  }
  function canSplit() {
    var cards = activeCards();
    return state.phase === "player" && state.hands.length === 1 && cards.length === 2 &&
      G.cardValue(cards[0]) === G.cardValue(cards[1]);
  }
  function canAct() {
    return state.phase === "player" && !state.finished && state.shoe.length > 0;
  }

  // ───────── Pintado ─────────
  function draw() {
    var phase = state.phase;
    var fresh = function (card) { return state.freshId === card.id; };

    table.replaceChildren(
      h("div", { class: "hand-area" },
        h("div", { class: "hand-label" }, h("span", {}, "Banca"), h("strong", {}, phase === "player" ? "?" : G.handValue(state.dealer))),
        h("div", { class: "cards-row" }, state.dealer.map(function (card, index) {
          return BJ.playingCard(card, { hidden: index === 1 && phase === "player", fresh: fresh(card) });
        }))),
      h("div", { class: "table-message" },
        h("span", { class: "status-message" + (state.roundResult ? " status-message--" + state.roundResult : "") }, state.label),
        h("p", {}, phase === "player" ? "Pide una carta o plántate" : phase === "dealer" ? "La banca está jugando…" : "Ronda finalizada")),
      h("div", { class: "hand-area hand-area--player" },
        h("div", { class: "player-hands" }, state.hands.map(function (hand, index) {
          var active = index === state.active && phase === "player";
          return h("div", { class: "split-hand" + (active ? " split-hand--active" : "") },
            state.hands.length > 1 ? h("span", { class: "split-hand__label" }, "Mano " + (index + 1)) : null,
            h("div", { class: "cards-row" }, hand.cards.map(function (card) { return BJ.playingCard(card, { fresh: fresh(card) }); })),
            hand.status === "bust" ? h("span", { class: "split-hand__bust" }, "Te has pasado") : null);
        })),
        h("div", { class: "hand-label" }, h("span", {}, "Tu mano"),
          h("strong", {}, activeCards().length ? G.handValue(activeCards()) : 0))));
    state.freshId = ""; // la animación de reparto solo se reproduce una vez

    var playing = phase === "player";
    btnStand.hidden = btnDouble.hidden = btnSplit.hidden = btnHit.hidden = phase === "done";
    btnNew.hidden = phase !== "done";
    btnStand.disabled = btnHit.disabled = !playing;
    btnDouble.disabled = !canDouble();
    btnSplit.disabled = !canSplit();
  }

  // ───────── Fin de ronda ─────────
  function recordResult(aggregate, scores, handsPlayed) {
    var count = BJ.loadMatches(BJ.session).length;
    BJ.addMatch(BJ.session, {
      name: "Partida " + (count + 1),
      result: RESULT_LABEL[aggregate],
      playerScore: scores.player,
      dealerScore: scores.dealer,
      hands: handsPlayed,
      decks: DECKS,
      notes: "Partida jugada en la mesa de Veintiuno.",
      source: "jugada",
    });
  }

  function finishRound(results, scores, label) {
    if (state.finished) return;
    state.finished = true;
    var wins = results.filter(function (r) { return r === "win"; }).length;
    var losses = results.filter(function (r) { return r === "loss"; }).length;
    var aggregate = wins > losses ? "win" : losses > wins ? "loss" : "draw";
    state.phase = "done";
    state.roundResult = aggregate;
    state.handResults = results;
    state.label = label || (aggregate === "win" ? "Has ganado" : aggregate === "loss" ? "Has perdido" : "Empate");
    recordResult(aggregate, scores, results.length);
    draw();
    resultTimer = setTimeout(openResultModal, 650);
    btnNew.focus();
  }

  function newRound() {
    clearTimeout(resultTimer);
    if (closeModal) closeModal();
    state.finished = false;
    if (state.shoe.length < 52) state.shoe = G.createDeck(DECKS);
    var dealt = state.shoe.splice(0, 4);
    var player = [dealt[0], dealt[2]];
    var dealer = [dealt[1], dealt[3]];
    handId += 1;
    state.hands = [{ id: handId, cards: player, status: "active" }];
    state.active = 0;
    state.dealer = dealer;
    state.roundResult = null;
    state.handResults = [];
    state.phase = "player";
    state.label = "Tu turno";
    state.freshId = "";
    draw();
    btnHit.focus();

    var peek = dealer[0].rank === "A" || ["10", "J", "Q", "K"].indexOf(dealer[0].rank) >= 0;
    if (peek && G.isBlackjack(dealer)) {
      var playerBj = G.isBlackjack(player);
      finishRound([playerBj ? "draw" : "loss"], { player: G.handValue(player), dealer: G.handValue(dealer) },
        playerBj ? "Empate" : "Blackjack de la banca");
    } else if (G.isBlackjack(player)) {
      finishRound(["win"], { player: 21, dealer: G.handValue(dealer) }, "¡Blackjack!");
    }
  }

  // ───────── Turnos ─────────
  async function dealerTurn() {
    if (state.phase !== "player" || state.finished) return;
    if (state.hands.every(function (hand) { return hand.status === "bust"; })) {
      return finishRound(state.hands.map(function () { return "loss"; }),
        { player: G.handValue(state.hands[0].cards), dealer: G.handValue(state.dealer) });
    }
    state.phase = "dealer";
    state.label = "Turno de la banca";
    draw();
    await sleep(700);
    while (G.handValue(state.dealer) < 17 && state.shoe.length > 0) {
      var card = state.shoe.shift();
      state.dealer.push(card);
      state.freshId = card.id;
      draw();
      await sleep(700);
    }
    var results = state.hands.map(function (hand) { return hand.status === "bust" ? "loss" : G.getResult(hand.cards, state.dealer); });
    var best = state.hands.find(function (hand) { return hand.status !== "bust"; }) || state.hands[0];
    finishRound(results, { player: G.handValue(best.cards), dealer: G.handValue(state.dealer) });
  }

  function completeHand(index) {
    var next = state.hands.findIndex(function (hand, i) { return i > index && hand.status === "active"; });
    if (next >= 0) {
      state.active = next;
      state.label = "Mano " + (next + 1) + " de " + state.hands.length;
      draw();
    } else {
      draw();
      dealerTurn();
    }
  }

  function hit() {
    if (!canAct()) return;
    var hand = state.hands[state.active];
    var card = state.shoe.shift();
    hand.cards.push(card);
    state.freshId = card.id;
    var score = G.handValue(hand.cards);
    if (score >= 21) {
      hand.status = score > 21 ? "bust" : "stood";
      completeHand(state.active);
    } else {
      draw();
    }
  }

  function stand() {
    if (state.phase !== "player" || state.finished) return;
    state.hands[state.active].status = "stood";
    completeHand(state.active);
  }

  function doubleDown() {
    if (!canAct() || activeCards().length !== 2) return;
    var hand = state.hands[state.active];
    var card = state.shoe.shift();
    hand.cards.push(card);
    hand.status = G.handValue(hand.cards) > 21 ? "bust" : "stood";
    state.freshId = card.id;
    completeHand(state.active);
  }

  function split() {
    if (!canAct() || !canSplit()) return;
    var cards = state.hands[0].cards;
    var cardA = state.shoe.shift();
    var cardB = state.shoe.shift();
    handId += 1;
    state.hands = [
      { id: state.hands[0].id, cards: [cards[0], cardA], status: "active" },
      { id: handId, cards: [cards[1], cardB], status: "active" },
    ];
    state.active = 0;
    state.freshId = cardB.id;
    state.label = "Mano 1 de 2";
    draw();
  }

  // ───────── Modales ─────────
  function openLeaveModal() {
    closeModal = BJ.openModal({
      title: "¿Seguro que quieres salir?",
      body: h("p", {}, state.phase === "done" ? "Volverás al inicio. Esta partida ya está guardada en tu historial." : "La ronda actual se perderá y no podrás recuperarla."),
      actions: [
        { label: "Seguir jugando", variant: "secondary" },
        { label: "Salir de la partida", variant: "danger", onClick: function () { BJ.go("index.html"); } },
      ],
      onClose: function () { closeModal = null; },
    });
  }

  function openResultModal() {
    var result = state.roundResult;
    closeModal = BJ.openModal({
      title: RESULT_TITLE[result],
      body: [
        h("div", { class: "result-icon result-icon--" + result, "aria-hidden": "true" }, RESULT_ICON[result]),
        state.handResults.length > 1
          ? h("p", { class: "hand-summary" }, state.handResults.map(function (r, i) { return "Mano " + (i + 1) + ": " + HAND_WORD[r]; }).join(" · "))
          : null,
        h("p", {}, RESULT_TEXT[result]),
      ],
      actions: [
        { label: "Volver al inicio", variant: "secondary", onClick: function () { BJ.go("index.html"); } },
        { label: "Nueva partida", onClick: newRound },
      ],
      onClose: function () { closeModal = null; },
    });
  }

  // ───────── Eventos ─────────
  btnStand.addEventListener("click", stand);
  btnDouble.addEventListener("click", doubleDown);
  btnSplit.addEventListener("click", split);
  btnHit.addEventListener("click", hit);
  btnNew.addEventListener("click", newRound);
  btnLeave.addEventListener("click", openLeaveModal);

  // Teclado: P pedir · S plantarse · N nueva partida
  document.addEventListener("keydown", function (event) {
    if (closeModal || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLInputElement) return;
    var key = event.key.toLowerCase();
    if (state.phase === "player" && key === "p") hit();
    if (state.phase === "player" && key === "s") stand();
    if (state.phase === "done" && key === "n") newRound();
  });

  newRound();
})(window.BJ = window.BJ || {});
