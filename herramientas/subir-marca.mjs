/**
 * Sube al bucket del sitio los archivos de la carpeta `marca/` y comprueba
 * que quedaron servibles.
 *
 *   DB_TOKEN=<token> node herramientas/subir-marca.mjs
 *
 * Son archivos reales de la marca (logo y tarjeta social), no relleno: sirven
 * para catálogos, WhatsApp y material impreso. Las fotos de los productos las
 * carga el dueño desde la app; para subir una a mano:
 *
 *   DB_TOKEN=<token> node herramientas/subir-a-r2.mjs foto.jpg productos/foto.jpg 1
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { armarMultipart } from "./multipart.mjs";

const API_DB = "https://yapanel.yadominios.com/api/hosting/db/query";
const SITIO = process.env.DB_SITIO ?? "proinshop";
const TOKEN = process.env.DB_TOKEN;
const BASE = process.env.SITIO_URL ?? "https://proinshop.com";

if (!TOKEN) {
  console.error("Falta DB_TOKEN en el entorno");
  process.exit(1);
}

async function consultar(sql, params = []) {
  const respuesta = await fetch(API_DB, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sitio: SITIO, token: TOKEN, sql, params }),
  });
  const cuerpo = await respuesta.json();
  if (cuerpo.error) throw new Error(cuerpo.error);
  return cuerpo;
}

// La tabla de códigos puede no existir todavía en la base.
await consultar(
  `CREATE TABLE IF NOT EXISTS codigo_subida (
     codigo TEXT PRIMARY KEY,
     expira TEXT NOT NULL,
     usado INTEGER NOT NULL DEFAULT 0,
     creado_en TEXT NOT NULL DEFAULT (datetime('now'))
   )`,
);

const archivos = readdirSync("marca").filter((n) => /\.(png|jpe?g|webp|svg)$/i.test(n));
if (archivos.length === 0) {
  console.error("No hay archivos en marca/");
  process.exit(1);
}

let subidos = 0;

for (const nombre of archivos) {
  const codigo = [...crypto.getRandomValues(new Uint8Array(24))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  await consultar(
    "INSERT INTO codigo_subida (codigo, expira) VALUES (?, datetime('now', '+10 minutes'))",
    [codigo],
  );

  const contenido = readFileSync(join("marca", nombre));
  const clave = `marca/${nombre}`;

  const { cuerpo, tipoContenido } = armarMultipart({ clave }, { nombre, contenido });

  const respuesta = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: { "x-codigo-subida": codigo, "content-type": tipoContenido },
    body: cuerpo,
  });
  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    console.error(`✕ ${clave} — HTTP ${respuesta.status}: ${resultado.error ?? "sin detalle"}`);
    await consultar("DELETE FROM codigo_subida WHERE codigo = ?", [codigo]);
    continue;
  }

  // Comprobar que de verdad se puede volver a bajar.
  const comprobacion = await fetch(`${BASE}/media/${clave}`);
  const bytes = Number(comprobacion.headers.get("content-length") ?? 0);
  const tipo = comprobacion.headers.get("content-type") ?? "?";

  console.log(
    `✓ ${clave.padEnd(38)} ${String(resultado.bytes).padStart(7)} bytes  →  ` +
      `${BASE}/media/${clave} [HTTP ${comprobacion.status}, ${tipo}, ${bytes} bytes]`,
  );
  subidos += 1;
}

console.log(`\n${subidos} de ${archivos.length} archivos en el bucket.`);
console.log("Compruébalo en el panel: YaDominios Cloud → tarjeta del sitio → Archivos.");
