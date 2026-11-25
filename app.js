const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Servir todos los archivos estáticos de la carpeta actual
app.use(express.static(path.join(__dirname)));

const server = app.listen(PORT, () => {
  console.log(`Servidor de Blackjack corriendo en http://localhost:${PORT}`);
});
