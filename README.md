# Veintiuno · Blackjack (Frontend)

Frontend del Proyecto Interdisciplinar 2: **HTML5 semántico + CSS3 + JavaScript nativo (ES6+)**, sin frameworks, sin Tailwind y sin paso de compilación. Es una web de Blackjack clásico (sin apuestas).

## Cómo abrirlo

1. Descomprime el zip.
2. Abre `index.html` (doble clic o con la extensión **Live Server** de VS Code). No hace falta `npm install` ni servidor.
3. La app pide acceso: pulsa **Entrar como invitado** o crea una cuenta en `Registro`.

> Los datos (cuentas y partidas) se guardan en `localStorage`/`sessionStorage`; no hay backend todavía.

## Páginas

| Página | Archivo | Contenido |
|---|---|---|
| Dashboard | `index.html` | Hero, estadísticas, buscador, filtros y grid de tarjetas |
| Login | `pages/login.html` | Formulario de acceso + modo invitado |
| Registro | `pages/registro.html` | Formulario de alta con validación |
| Crear | `pages/crear.html` | Formulario de inserción: registrar una partida |
| Detalle | `pages/detalle.html?id=…` | Ficha detallada de una partida |
| Jugar | `pages/jugar.html` | Mesa de Blackjack (pedir, plantarse, doblar, dividir) |
| Guía de estilos | `pages/guia-estilos.html` | Sistema de diseño |

La documentación técnica completa está en **[MEMORIA.md](MEMORIA.md)**.
