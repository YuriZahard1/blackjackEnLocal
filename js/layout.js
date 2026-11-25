/**
 * layout.js — Código común a todas las páginas:
 *  · control de acceso (páginas privadas / solo invitados)
 *  · menú hamburguesa, nombre de usuario, cerrar sesión (con modal) y modal de reglas
 *
 * La página declara su comportamiento en <body>:
 *   data-access="private" | "guest-only"   data-root="" | "../"   data-nav="inicio|jugar|crear"
 */
(function (BJ) {
  "use strict";

  var h = BJ.h;
  var body = document.body;
  var session = BJ.loadSession();
  var isGuest = !!session && session.kind === "guest";

  BJ.session = session;
  BJ.isGuest = isGuest;

  // ───────── Control de acceso ─────────
  var access = body.dataset.access;
  // BJ.redirecting avisa a los scripts de cada página de que no deben ejecutarse.
  if (access === "private" && !session) {
    BJ.redirecting = true;
    BJ.go("pages/login.html");
    return;
  }
  if (access === "guest-only" && session) {
    BJ.redirecting = true;
    BJ.go("index.html");
    return;
  }

  // ───────── Modales comunes ─────────
  var RULES = [
    ["El objetivo", "Acércate a 21 sin pasarte y supera la puntuación de la banca."],
    ["Valor de las cartas", "Las figuras valen 10. El As vale 1 u 11, lo que más te convenga."],
    ["Tus acciones", "Puedes pedir, plantarte, doblar con tus dos primeras cartas o dividir una pareja de igual valor."],
    ["Blackjack natural", "Un As y una carta de valor 10 en el reparto inicial vencen a cualquier 21 de tres o más cartas."],
    ["La banca", "Roba hasta alcanzar 17 o más. Si te pasas de 21, pierdes esa mano al instante."],
  ];

  BJ.openRulesModal = function () {
    var list = h("div", { class: "rules-list" }, RULES.map(function (rule, index) {
      return h("div", {}, h("span", {}, String(index + 1).padStart(2, "0")), h("p", {}, h("strong", {}, rule[0]), rule[1]));
    }));
    BJ.openModal({ title: "Reglas del Blackjack", body: list, actions: [{ label: "Entendido" }] });
  };

  BJ.confirmLogout = function () {
    BJ.openModal({
      title: isGuest ? "¿Salir del modo invitado?" : "¿Cerrar sesión?",
      body: h("p", {}, isGuest
        ? "Tu sesión es provisional: al salir se borrarán todas tus partidas y estadísticas."
        : "Tus partidas quedan guardadas en este navegador. Podrás volver a entrar con tu correo y contraseña."),
      actions: [
        { label: "Cancelar", variant: "secondary" },
        {
          label: isGuest ? "Salir y borrar datos" : "Cerrar sesión",
          variant: "danger",
          onClick: function () {
            BJ.clearSession(session);
            BJ.go("pages/login.html");
          },
        },
      ],
    });
  };

  // ───────── Cabecera: menú hamburguesa y acciones ─────────
  var header = document.querySelector(".site-header");
  if (!header) return;

  var toggle = header.querySelector(".menu-toggle");
  var nav = header.querySelector(".main-nav");

  function setOpen(open) {
    nav.classList.toggle("main-nav--open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  var isOpen = function () { return nav.classList.contains("main-nav--open"); };

  toggle.addEventListener("click", function () { setOpen(!isOpen()); });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", function (event) {
    if (isOpen() && !header.contains(event.target)) setOpen(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) setOpen(false);
  });

  // Nombre de usuario y enlace activo
  var userLabel = header.querySelector("[data-user-name]");
  if (userLabel && session) {
    var user = isGuest ? null : BJ.getUser(session.userId);
    userLabel.textContent = isGuest ? "Invitado" : (user ? user.name : "Jugador");
  }
  var logout = header.querySelector('[data-action="logout"]');
  if (logout) logout.textContent = isGuest ? "Salir" : "Cerrar sesión";

  var current = header.querySelector('a[data-nav="' + body.dataset.nav + '"]');
  if (current) current.setAttribute("aria-current", "page");

  header.querySelectorAll('[data-action="rules"]').forEach(function (btn) {
    btn.addEventListener("click", function () { setOpen(false); BJ.openRulesModal(); });
  });
  header.querySelectorAll('[data-action="logout"]').forEach(function (btn) {
    btn.addEventListener("click", function () { setOpen(false); BJ.confirmLogout(); });
  });
})(window.BJ = window.BJ || {});
