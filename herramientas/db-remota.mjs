/**
 * Ejecuta SQL contra la base D1 del sitio en YaDominios Cloud, por su API HTTP.
 *
 *   DB_TOKEN=<token> node herramientas/db-remota.mjs db/schema.sql
 *   DB_TOKEN=<token> node herramientas/db-remota.mjs seed.json
 *
 * - Archivo .sql  → se parte en sentencias (una llamada por sentencia).
 * - Archivo .json → arreglo de { sql, params } parametrizados.
 *
 * El token SIEMPRE llega por la variable de entorno DB_TOKEN, en línea con el
 * comando: nunca se escribe en un archivo ni se commitea.
 */

import { readFileSync } from "node:fs";

const API = "https://yapanel.yadominios.com/api/hosting/db/query";
const SITIO = process.env.DB_SITIO ?? "proinshop";
const TOKEN = process.env.DB_TOKEN;

if (!TOKEN) {
  console.error("Falta DB_TOKEN en el entorno");
  process.exit(1);
}

const archivo = process.argv[2];
if (!archivo) {
  console.error("Uso: DB_TOKEN=… node herramientas/db-remota.mjs <archivo.sql|archivo.json>");
  process.exit(1);
}

/** @type {{sql: string, params?: unknown[]}[]} */
let sentencias;

if (archivo.endsWith(".json")) {
  sentencias = JSON.parse(readFileSync(archivo, "utf8"));
} else {
  sentencias = readFileSync(archivo, "utf8")
    .split("\n")
    // Comentarios y PRAGMA fuera: cada llamada HTTP es su propia sesión,
    // así que un PRAGMA no tendría efecto de todos modos.
    .filter((linea) => !linea.trim().startsWith("--") && !linea.trim().startsWith("PRAGMA"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((sql) => ({ sql }));
}

let lecturas = 0;
let escrituras = 0;

for (const [indice, { sql, params = [] }] of sentencias.entries()) {
  const respuesta = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sitio: SITIO, token: TOKEN, sql, params }),
  });

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok || cuerpo.error) {
    console.error(`✕ [${indice + 1}/${sentencias.length}] ${sql.slice(0, 90)}…`);
    console.error(`  HTTP ${respuesta.status}: ${cuerpo.error ?? JSON.stringify(cuerpo)}`);
    process.exit(1);
  }

  lecturas += cuerpo.rowsRead ?? 0;
  escrituras += cuerpo.rowsWritten ?? 0;
  const resumen = sql.replace(/\s+/g, " ").slice(0, 72);
  console.log(`✓ [${indice + 1}/${sentencias.length}] ${resumen}`);
}

console.log(`\nListo: ${sentencias.length} sentencias · ${lecturas} filas leídas · ${escrituras} escritas`);
