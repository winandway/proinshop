/**
 * Sube un archivo al bucket del sitio a través de la ruta /upload.
 *
 *   DB_TOKEN=<token> node herramientas/subir-a-r2.mjs <archivo> [clave] [producto_id]
 *
 * Como R2 no tiene API pública, el archivo se manda al worker, que es quien
 * escribe en el bucket. El permiso es un código de un solo uso que este script
 * crea en la base y que el worker verifica y quema.
 */

import { readFileSync } from "node:fs";
import { basename } from "node:path";

const API_DB = "https://yapanel.yadominios.com/api/hosting/db/query";
const SITIO = process.env.DB_SITIO ?? "proinshop";
const TOKEN = process.env.DB_TOKEN;
const BASE = process.env.SITIO_URL ?? "https://proinshop.com";

if (!TOKEN) {
  console.error("Falta DB_TOKEN en el entorno");
  process.exit(1);
}

const [archivo, claveArgumento, productoId] = process.argv.slice(2);
if (!archivo) {
  console.error("Uso: DB_TOKEN=… node herramientas/subir-a-r2.mjs <archivo> [clave] [producto_id]");
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

// Código aleatorio, válido 10 minutos y de un solo uso.
const codigo = [...crypto.getRandomValues(new Uint8Array(24))]
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

await consultar(
  "INSERT INTO codigo_subida (codigo, expira) VALUES (?, datetime('now', '+10 minutes'))",
  [codigo],
);

const contenido = readFileSync(archivo);
const clave = claveArgumento ?? `productos/${basename(archivo)}`;
const tipos = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
const extension = archivo.split(".").pop()?.toLowerCase() ?? "";

const formulario = new FormData();
formulario.append(
  "archivo",
  new Blob([contenido], { type: tipos[extension] ?? "application/octet-stream" }),
  basename(archivo),
);
formulario.append("clave", clave);
if (productoId) formulario.append("producto_id", productoId);

const respuesta = await fetch(`${BASE}/upload`, {
  method: "POST",
  headers: { "x-codigo-subida": codigo },
  body: formulario,
});

const resultado = await respuesta.json().catch(() => ({}));

if (!respuesta.ok) {
  console.error(`✕ HTTP ${respuesta.status}: ${resultado.error ?? JSON.stringify(resultado)}`);
  // El código no sirve para nada más; se borra para no dejar basura.
  await consultar("DELETE FROM codigo_subida WHERE codigo = ?", [codigo]);
  process.exit(1);
}

console.log(`✓ ${clave} — ${resultado.bytes} bytes → ${BASE}${resultado.url}`);
