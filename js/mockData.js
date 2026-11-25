/**
 * mockData.js — Datos simulados que hacen de "base de datos" del Proyecto 1.
 *
 * Entidad PARTIDA (tabla `partidas` del modelo de datos):
 *   id, name, playedAt (ms), result ("Victoria" | "Derrota" | "Empate"),
 *   playerScore, dealerScore, hands, decks, notes, example (true = dato de ejemplo)
 *
 * El Dashboard (js/dashboard.js) lee este array y lo mezcla con las
 * partidas reales del usuario guardadas en localStorage.
 */
(function (BJ) {
  "use strict";

  BJ.mockMatches = [
    { id: "m1", name: "Noche de ases", playedAt: new Date(2026, 5, 18, 20, 42).getTime(), result: "Victoria", playerScore: 21, dealerScore: 19, hands: 3, decks: 6, notes: "Blackjack en la segunda mano. La banca se quedó en 19.", example: true },
    { id: "m2", name: "Ronda rápida", playedAt: new Date(2026, 5, 17, 18, 10).getTime(), result: "Derrota", playerScore: 22, dealerScore: 18, hands: 2, decks: 6, notes: "Pedí carta con 16 y me pasé por uno.", example: true },
    { id: "m3", name: "Mesa esmeralda", playedAt: new Date(2026, 5, 15, 22, 31).getTime(), result: "Empate", playerScore: 20, dealerScore: 20, hands: 4, decks: 4, notes: "Cuatro manos muy igualadas.", example: true },
    { id: "m4", name: "Después del trabajo", playedAt: new Date(2026, 5, 12, 19, 5).getTime(), result: "Victoria", playerScore: 20, dealerScore: 24, hands: 5, decks: 6, notes: "La banca se pasó con 24.", example: true },
    { id: "m5", name: "Blackjack directo", playedAt: new Date(2026, 5, 9, 21, 22).getTime(), result: "Victoria", playerScore: 21, dealerScore: 17, hands: 1, decks: 2, notes: "As y figura en el reparto inicial.", example: true },
    { id: "m6", name: "Viernes clásico", playedAt: new Date(2026, 5, 6, 17, 46).getTime(), result: "Derrota", playerScore: 18, dealerScore: 20, hands: 3, decks: 6, notes: "Me planté con 18 y la banca sacó 20.", example: true },
    { id: "m7", name: "Última mano", playedAt: new Date(2026, 5, 2, 23, 14).getTime(), result: "Empate", playerScore: 19, dealerScore: 19, hands: 2, decks: 8, notes: "Empate a 19 en la última ronda de la noche.", example: true },
    { id: "m8", name: "Tarde de cartas", playedAt: new Date(2026, 4, 30, 16, 30).getTime(), result: "Derrota", playerScore: 23, dealerScore: 17, hands: 4, decks: 6, notes: "Dividí un par de 8 y una de las manos se pasó.", example: true },
  ];
})(window.BJ = window.BJ || {});
