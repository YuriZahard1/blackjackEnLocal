/**
 * dom.js — Utilidades de DOM: creación de nodos (createElement), cartas y modales accesibles.
 */
(function (BJ) {
  "use strict";

  function append(parent, children) {
    children.flat(Infinity).forEach(function (child) {
      if (child == null || child === false) return;
      parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
    });
  }

  /**
   * Crea un elemento con createElement.
   * props: class, onXxx (eventos), cualquier otro valor → atributo.
   */
  BJ.h = function (tag, props) {
    var children = Array.prototype.slice.call(arguments, 2);
    var node = document.createElement(tag);
    Object.entries(props || {}).forEach(function (entry) {
      var key = entry[0];
      var value = entry[1];
      if (value == null || value === false) return;
      if (key === "class") node.className = value;
      else if (key.indexOf("on") === 0 && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    append(node, children);
    return node;
  };

  BJ.button = function (label, options) {
    var opts = options || {};
    var variant = opts.variant || "primary";
    return BJ.h("button", { class: "button button--" + variant, type: opts.type || "button", onClick: opts.onClick }, label);
  };

  var SUITS = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
  var SUIT_NAMES = { spades: "picas", hearts: "corazones", diamonds: "diamantes", clubs: "tréboles" };

  BJ.playingCard = function (card, options) {
    var opts = options || {};
    var h = BJ.h;
    if (opts.hidden) {
      return h("div", { class: "playing-card playing-card--back", "aria-label": "Carta oculta" }, h("span", {}, "V"), h("i", {}, "♠"));
    }
    var symbol = SUITS[card.suit];
    var red = card.suit === "hearts" || card.suit === "diamonds";
    var classes = "playing-card" + (red ? " playing-card--red" : "") + (opts.fresh ? " playing-card--fresh" : "");
    return h("div", { class: classes, "aria-label": card.rank + " de " + SUIT_NAMES[card.suit] },
      h("div", { class: "card-corner" }, h("strong", {}, card.rank), h("span", {}, symbol)),
      h("span", { class: "card-suit" }, symbol));
  };

  var FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  /**
   * Abre un modal. actions: [{ label, variant, onClick }].
   * Se cierra con Escape, clic en el fondo o la ×. Atrapa el foco y lo devuelve al cerrar.
   * @returns {Function} función para cerrarlo
   */
  BJ.openModal = function (config) {
    var h = BJ.h;
    var actions = config.actions || [];
    var previousFocus = document.activeElement;
    var closed = false;
    var dialog;
    var backdrop;

    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKey);
      backdrop.remove();
      document.body.style.overflow = "";
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
      if (config.onClose) config.onClose();
    }

    function onKey(event) {
      if (event.key === "Escape") return close();
      if (event.key !== "Tab") return;
      var items = Array.prototype.slice.call(dialog.querySelectorAll(FOCUSABLE));
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    var actionButtons = actions.map(function (action) {
      return BJ.button(action.label, {
        variant: action.variant || "primary",
        onClick: function () {
          close();
          if (action.onClick) action.onClick();
        },
      });
    });

    dialog = h("section",
      { class: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title" },
      h("div", { class: "modal__header" },
        h("h2", { id: "modal-title" }, config.title),
        h("button", { class: "icon-button", type: "button", "aria-label": "Cerrar modal", onClick: close }, "×")),
      h("div", { class: "modal__body" }, config.body),
      actionButtons.length ? h("div", { class: "modal__actions" }, actionButtons) : null);

    backdrop = h("div", {
      class: "modal-backdrop",
      role: "presentation",
      onMouseDown: function (event) { if (event.target === backdrop) close(); },
    }, dialog);

    document.body.append(backdrop);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    (actionButtons[actionButtons.length - 1] || dialog.querySelector(".icon-button")).focus();
    return close;
  };

  /** Navega a una ruta relativa a la raíz del proyecto (index.html o pages/xxx.html). */
  BJ.go = function (path) {
    window.location.href = (document.body.dataset.root || "") + path;
  };
})(window.BJ = window.BJ || {});
