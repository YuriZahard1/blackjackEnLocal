/**
 * auth.js — Lógica de login.html y registro.html.
 * Validación en tiempo real (validation.js), sesión local y modo invitado.
 */
(function (BJ) {
  "use strict";
  if (BJ.redirecting) return;

  var h = BJ.h;

  function startSession(session) {
    BJ.saveSession(session);
    BJ.go("index.html");
  }

  function showError(box, text) {
    box.textContent = text;
    box.hidden = !text;
  }

  /** Ejecuta el envío con el botón bloqueado mientras se resuelve. */
  async function withSubmitting(submit, task) {
    submit.disabled = true;
    try {
      await task();
    } finally {
      submit.disabled = false;
    }
  }

  // ───────── Elementos comunes: invitado y "olvidé mi contraseña" ─────────
  document.querySelectorAll('[data-action="guest"]').forEach(function (btn) {
    btn.addEventListener("click", function () { startSession({ kind: "guest" }); });
  });

  document.querySelectorAll('[data-action="forgot"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      BJ.openModal({
        title: "Recuperar contraseña",
        body: h("p", {}, "Tus cuentas se guardan solo en este navegador, así que no es posible recuperar una contraseña olvidada. Puedes crear una cuenta nueva con otro correo o entrar como invitado."),
        actions: [{ label: "Entendido" }],
      });
    });
  });

  // ───────── Login ─────────
  var loginForm = document.getElementById("login-form");
  if (loginForm) {
    var login = BJ.initForm(loginForm);
    var loginError = document.getElementById("form-error");
    var loginSubmit = loginForm.querySelector('[type="submit"]');

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      showError(loginError, "");
      if (!login.validateAll()) return;
      withSubmitting(loginSubmit, async function () {
        var result = await BJ.loginUser(loginForm.elements.email.value, loginForm.elements.password.value);
        if (result.ok) startSession(result.session);
        else showError(loginError, result.error);
      });
    });
  }

  // ───────── Registro ─────────
  var registerForm = document.getElementById("register-form");
  if (registerForm) {
    var register = BJ.initForm(registerForm);
    var registerError = document.getElementById("form-error");
    var registerSubmit = registerForm.querySelector('[type="submit"]');
    registerForm.elements.birth.max = BJ.todayISO(); // no se puede elegir una fecha futura

    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      showError(registerError, "");
      if (!register.validateAll()) return;
      withSubmitting(registerSubmit, async function () {
        var f = registerForm.elements;
        var result = await BJ.registerUser({
          name: f.name.value,
          email: f.email.value,
          birthDate: f.birth.value,
          password: f.password.value,
        });
        if (result.ok) startSession(result.session);
        else showError(registerError, result.error);
      });
    });
  }
})(window.BJ = window.BJ || {});
