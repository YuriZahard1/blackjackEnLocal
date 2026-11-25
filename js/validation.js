/**
 * validation.js — Validación de formularios en tiempo real (eventos input / blur / change).
 *
 * Los formularios llevan `novalidate` (sin tooltips del navegador). Cada campo declara su
 * regla en HTML con data-rule="..." y, opcionalmente, un texto de éxito con data-success="...".
 * Los errores se pintan en el DOM dentro de <p class="field__message">.
 */
(function (BJ) {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function todayISO() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function ageFrom(date) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var age = today.getFullYear() - date.getFullYear();
    if (today < new Date(today.getFullYear(), date.getMonth(), date.getDate())) age -= 1;
    return age;
  }

  /** Cada regla devuelve "" si es válido o el mensaje de error. Firma: (valor, elemento, formulario). */
  var rules = {
    name: function (value) {
      var v = value.trim();
      if (!v) return "Introduce tu nombre de usuario.";
      if (v.length < 3) return "Usa al menos 3 caracteres.";
      if (v.length > 20) return "Máximo 20 caracteres.";
      if (!/^[\p{L}\p{N}_ .-]+$/u.test(v)) return "Solo letras, números, espacios, punto, guion o guion bajo.";
      return "";
    },
    email: function (value) {
      var v = value.trim();
      if (!v) return "Introduce tu correo electrónico.";
      if (!EMAIL_RE.test(v)) return "El formato del correo no es válido (ej. tu@correo.com).";
      return "";
    },
    loginPassword: function (value) {
      if (!value) return "Introduce tu contraseña.";
      if (value.length < 8) return "Debe tener al menos 8 caracteres.";
      return "";
    },
    newPassword: function (value) {
      if (!value) return "Crea una contraseña.";
      if (value.length < 8) return "Debe tener al menos 8 caracteres.";
      if (!/[A-Za-z]/.test(value)) return "Incluye al menos una letra.";
      if (!/\d/.test(value)) return "Incluye al menos un número.";
      return "";
    },
    confirm: function (value, el, form) {
      if (!value) return "Repite la contraseña.";
      var password = form.querySelector('[data-rule="newPassword"]');
      if (password && value !== password.value) return "Las contraseñas no coinciden.";
      return "";
    },
    /** Fecha de nacimiento: válida, no futura, año ≥ 1900 y mayor de 18. */
    birthDate: function (value) {
      if (!value) return "Introduce tu fecha de nacimiento.";
      var date = new Date(value + "T00:00:00");
      if (Number.isNaN(date.getTime())) return "La fecha no es válida.";
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) return "La fecha no puede ser futura.";
      if (date.getFullYear() < 1900) return "Introduce un año válido.";
      if (ageFrom(date) < 18) return "Debes tener 18 años o más para jugar.";
      return "";
    },
    terms: function (value, el) {
      return el.checked ? "" : "Debes aceptar los términos para continuar.";
    },

    // ── Formulario de crear partida ──
    matchName: function (value) {
      var v = value.trim();
      if (!v) return "Ponle un nombre a la partida.";
      if (v.length < 3) return "Usa al menos 3 caracteres.";
      if (v.length > 40) return "Máximo 40 caracteres.";
      return "";
    },
    matchDate: function (value) {
      if (!value) return "Indica cuándo jugaste la partida.";
      var date = new Date(value + "T00:00:00");
      if (Number.isNaN(date.getTime())) return "La fecha no es válida.";
      if (value > todayISO()) return "La fecha no puede ser futura.";
      if (date.getFullYear() < 2020) return "Introduce una fecha a partir de 2020.";
      return "";
    },
    required: function (value) {
      return value ? "" : "Elige una opción.";
    },
    score: function (value) {
      if (value === "") return "Introduce una puntuación.";
      var n = Number(value);
      if (!Number.isInteger(n) || n < 0 || n > 31) return "Debe ser un número entero entre 0 y 31.";
      return "";
    },
    hands: function (value) {
      if (value === "") return "Introduce las manos jugadas.";
      var n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 20) return "Debe ser un número entero entre 1 y 20.";
      return "";
    },
    notes: function (value) {
      return value.length > 200 ? "Máximo 200 caracteres (llevas " + value.length + ")." : "";
    },
  };

  /** Conecta un campo con su regla y pinta el estado en el DOM. */
  function initField(el, form) {
    var rule = rules[el.dataset.rule];
    var root = el.closest(".field");
    var message = root.querySelector(".field__message");
    var success = el.dataset.success || "";
    var touched = false;

    function render() {
      var error = rule(el.value, el, form);
      root.classList.remove("field--error", "field--success");
      el.removeAttribute("aria-invalid");
      message.removeAttribute("role");
      if (!touched) return !error;
      var text = error || success;
      if (error) {
        root.classList.add("field--error");
        el.setAttribute("aria-invalid", "true");
        message.setAttribute("role", "alert");
      } else if (success) {
        root.classList.add("field--success");
      }
      message.hidden = !text;
      message.replaceChildren(BJ.h("span", { "aria-hidden": "true" }, error ? "!" : "✓"), " " + text);
      return !error;
    }

    function onChange() {
      touched = true;
      render();
    }
    el.addEventListener("input", onChange);
    el.addEventListener("change", onChange);
    el.addEventListener("blur", function () {
      // Un campo vacío y sin tocar no se marca al pasar por él; sí al enviar el formulario.
      if (el.value !== "" || touched) onChange();
    });

    return {
      el: el,
      check: function () { touched = true; return render(); },
      revalidate: function () { if (touched) render(); },
      reset: function () { touched = false; render(); message.hidden = true; },
    };
  }

  /** Inicializa todos los campos [data-rule] de un formulario. */
  BJ.initForm = function (form) {
    var fields = Array.prototype.slice.call(form.querySelectorAll("[data-rule]")).map(function (el) { return initField(el, form); });

    // Si cambia la contraseña, se recomprueba la repetición.
    var password = form.querySelector('[data-rule="newPassword"]');
    var confirm = fields.find(function (field) { return field.el.dataset.rule === "confirm"; });
    if (password && confirm) password.addEventListener("input", function () { confirm.revalidate(); });

    // Contador de caracteres en campos con data-counter
    form.querySelectorAll("[data-counter]").forEach(function (el) {
      var counter = document.getElementById(el.dataset.counter);
      var update = function () { counter.textContent = el.value.length + " / " + el.dataset.max; };
      el.addEventListener("input", update);
      update();
    });

    return {
      fields: fields,
      /** Valida todos los campos, enfoca el primero inválido y devuelve si el formulario es válido. */
      validateAll: function () {
        var results = fields.map(function (field) { return field.check(); });
        var firstInvalid = fields.find(function (field, index) { return !results[index]; });
        if (firstInvalid) firstInvalid.el.focus();
        return !firstInvalid;
      },
      reset: function () {
        form.reset();
        fields.forEach(function (field) { field.reset(); });
      },
    };
  };

  BJ.rules = rules;
  BJ.todayISO = todayISO;
})(window.BJ = window.BJ || {});
