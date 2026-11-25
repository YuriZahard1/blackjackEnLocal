/**
 * storage.js — "Base de datos" local de Veintiuno.
 *
 *  - Cuentas y partidas de usuarios registrados → localStorage (persisten).
 *  - Sesión activa y modo invitado → sessionStorage (se borran al cerrar la pestaña).
 *
 * Sesión: { kind: "user", userId } | { kind: "guest" }
 */
(function (BJ) {
  "use strict";

  var USERS_KEY = "veintiuno:users";
  var SESSION_KEY = "veintiuno:session";
  var GUEST_MATCHES_KEY = "veintiuno:guest:matches";
  var matchesKey = function (userId) { return "veintiuno:matches:" + userId; };

  function read(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Almacenamiento lleno o bloqueado: la app sigue funcionando en memoria.
    }
  }

  // ───────── Utilidades ─────────
  BJ.randomId = function () {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  };

  async function hashPassword(password, salt) {
    var data = new TextEncoder().encode(salt + ":" + password);
    if (window.crypto && window.crypto.subtle) {
      var digest = await window.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest))
        .map(function (byte) { return byte.toString(16).padStart(2, "0"); })
        .join("");
    }
    // Alternativa para contextos no seguros (http fuera de localhost).
    var hash = 5381;
    data.forEach(function (byte) { hash = ((hash << 5) + hash + byte) >>> 0; });
    return "fallback-" + hash.toString(16);
  }

  // ───────── Usuarios ─────────
  var normalizeEmail = function (email) { return email.trim().toLowerCase(); };
  var loadUsers = function () { return read(localStorage, USERS_KEY, []); };

  BJ.getUser = function (userId) {
    return loadUsers().find(function (user) { return user.id === userId; });
  };

  BJ.registerUser = async function (data) {
    var users = loadUsers();
    var email = normalizeEmail(data.email);
    if (users.some(function (user) { return user.email === email; })) {
      return { ok: false, error: "Ya existe una cuenta con ese correo." };
    }
    var salt = BJ.randomId();
    var user = {
      id: BJ.randomId(),
      name: data.name.trim(),
      email: email,
      birthDate: data.birthDate,
      salt: salt,
      passwordHash: await hashPassword(data.password, salt),
      createdAt: Date.now(),
    };
    write(localStorage, USERS_KEY, users.concat(user));
    return { ok: true, session: { kind: "user", userId: user.id } };
  };

  BJ.loginUser = async function (email, password) {
    var user = loadUsers().find(function (item) { return item.email === normalizeEmail(email); });
    var invalid = { ok: false, error: "Correo o contraseña incorrectos." };
    if (!user) return invalid;
    var hash = await hashPassword(password, user.salt);
    return hash === user.passwordHash ? { ok: true, session: { kind: "user", userId: user.id } } : invalid;
  };

  // ───────── Sesión ─────────
  BJ.loadSession = function () { return read(sessionStorage, SESSION_KEY, null); };
  BJ.saveSession = function (session) { write(sessionStorage, SESSION_KEY, session); };

  BJ.clearSession = function (session) {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      if (session && session.kind === "guest") sessionStorage.removeItem(GUEST_MATCHES_KEY);
    } catch (error) {
      // ignorado
    }
  };

  // ───────── Partidas (CRUD) ─────────
  BJ.loadMatches = function (session) {
    if (!session) return [];
    return session.kind === "user"
      ? read(localStorage, matchesKey(session.userId), [])
      : read(sessionStorage, GUEST_MATCHES_KEY, []);
  };

  BJ.saveMatches = function (session, matches) {
    if (!session) return;
    if (session.kind === "user") write(localStorage, matchesKey(session.userId), matches);
    else write(sessionStorage, GUEST_MATCHES_KEY, matches);
  };

  /** Crea una partida (INSERT) y la devuelve con su id. */
  BJ.addMatch = function (session, data) {
    var match = Object.assign({ id: BJ.randomId(), playedAt: Date.now(), decks: 6, notes: "" }, data);
    BJ.saveMatches(session, [match].concat(BJ.loadMatches(session)));
    return match;
  };

  /** Elimina una partida propia (DELETE). */
  BJ.deleteMatch = function (session, id) {
    BJ.saveMatches(session, BJ.loadMatches(session).filter(function (match) { return match.id !== id; }));
  };

  /** Partidas reales + datos simulados (mockData.js), de más reciente a más antigua. */
  BJ.getAllMatches = function (session) {
    return BJ.loadMatches(session)
      .concat(BJ.mockMatches)
      .sort(function (a, b) { return b.playedAt - a.playedAt; });
  };

  /** Busca una partida por id (SELECT ... WHERE id). */
  BJ.findMatch = function (session, id) {
    return BJ.getAllMatches(session).find(function (match) { return match.id === id; }) || null;
  };

  // ───────── Formato ─────────
  BJ.formatMatchDate = function (timestamp) {
    var date = new Date(timestamp);
    var month = date.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
    var time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    return date.getDate() + " " + month + " " + date.getFullYear() + " · " + time;
  };

  BJ.TONES = { Victoria: "win", Derrota: "loss", Empate: "draw" };
})(window.BJ = window.BJ || {});
