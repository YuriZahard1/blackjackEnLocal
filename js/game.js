/**
 * game.js — Reglas del Blackjack (lógica pura, sin DOM).
 */
(function (BJ) {
  "use strict";

  var SUITS = ["spades", "hearts", "diamonds", "clubs"];
  var RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var game = (BJ.game = {});

  game.shuffle = function (items) {
    var shuffled = items.slice();
    for (var i = shuffled.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    return shuffled;
  };

  game.createDeck = function (deckCount) {
    var cards = [];
    for (var d = 0; d < (deckCount || 1); d += 1) {
      SUITS.forEach(function (suit) {
        RANKS.forEach(function (rank) { cards.push({ id: d + "-" + suit + "-" + rank, suit: suit, rank: rank }); });
      });
    }
    return game.shuffle(cards);
  };

  /** Valor de una carta (el As cuenta 11; handValue lo rebaja si hace falta). */
  game.cardValue = function (card) {
    if (card.rank === "A") return 11;
    if (["J", "Q", "K"].indexOf(card.rank) >= 0) return 10;
    return Number(card.rank);
  };

  game.handValue = function (hand) {
    var value = 0;
    var aces = 0;
    hand.forEach(function (card) {
      value += game.cardValue(card);
      if (card.rank === "A") aces += 1;
    });
    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }
    return value;
  };

  game.isBlackjack = function (hand) {
    return hand.length === 2 && game.handValue(hand) === 21;
  };

  /** @returns {"win" | "loss" | "draw"} */
  game.getResult = function (player, dealer) {
    var p = game.handValue(player);
    var d = game.handValue(dealer);
    if (p > 21) return "loss";
    if (d > 21) return "win";
    if (p > d) return "win";
    if (p < d) return "loss";
    return "draw";
  };
})(window.BJ = window.BJ || {});
