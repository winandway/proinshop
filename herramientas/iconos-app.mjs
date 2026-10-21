/**
 * Genera los íconos de la app instalable (Android pide 192 y 512 píxeles) a
 * partir de la diana del logo. Cuando llegue el logo original en vector, se
 * cambia el dibujo de aquí y se vuelve a correr:
 *   node herramientas/iconos-app.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const cache = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
const carpeta = fs.readdirSync(cache).filter((c) => /^chromium-\d+$/.test(c)).sort().reverse()[0];
const CHROME =
  process.env.CHROME ??
  path.join(cache, carpeta, "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing");
const SALIDA = path.join(import.meta.dirname, "..", "public", "iconos");
fs.mkdirSync(SALIDA, { recursive: true });

const diana = (color) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="44" fill="none" stroke="${color}" stroke-width="10"/>
  <circle cx="50" cy="50" r="29" fill="none" stroke="${color}" stroke-width="8.5"/>
  <circle cx="50" cy="50" r="15" fill="none" stroke="${color}" stroke-width="7"/>
  <circle cx="50" cy="50" r="5.5" fill="${color}"/></svg>`;

const navegador = await chromium.launch({ executablePath: CHROME, headless: true });
const pagina = await navegador.newPage();
// [archivo, tamaño, fondo, color de la diana, cuánto ocupa la diana]
// Los «mascara» dejan margen: Android los recorta en círculo o en gota.
for (const [nombre, tam, fondo, color, escala] of [
  ["icono-192.png", 192, "#ffffff", "#ff2d2d", 0.78],
  ["icono-512.png", 512, "#ffffff", "#ff2d2d", 0.78],
  ["icono-mascara-192.png", 192, "#ff2d2d", "#ffffff", 0.56],
  ["icono-mascara-512.png", 512, "#ff2d2d", "#ffffff", 0.56],
]) {
  await pagina.setViewportSize({ width: tam, height: tam });
  const lado = Math.round(tam * escala);
  await pagina.setContent(
    `<html><body style="margin:0;width:${tam}px;height:${tam}px;background:${fondo};display:grid;place-items:center">` +
      `<div style="width:${lado}px;height:${lado}px">${diana(color)}</div></body></html>`,
  );
  await pagina.screenshot({ path: path.join(SALIDA, nombre) });
  console.log("✓", nombre);
}
await navegador.close();
