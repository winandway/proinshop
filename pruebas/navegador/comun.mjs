/**
 * Lo común de las pruebas en el navegador. Se corren a mano contra la copia
 * local (herramientas/probar-local.sh), no en la nube: necesitan la base de
 * prueba y una sesión abierta en ella.
 *
 *   PROINSHOP_SESION=<id de una sesión de la base local> node pruebas/navegador/huella.mjs
 *
 * Variables: PROINSHOP_BASE (por defecto http://localhost:8830), CHROME (la
 * ruta del navegador; por defecto, el que dejó instalado Playwright) y
 * CAPTURAS (carpeta donde guardar capturas, opcional).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

export const BASE = process.env.PROINSHOP_BASE ?? "http://localhost:8830";
export const CAPTURAS = process.env.CAPTURAS;

function chromeInstalado() {
  if (process.env.CHROME) return process.env.CHROME;
  const cache = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  const carpetas = fs.existsSync(cache)
    ? fs.readdirSync(cache).filter((c) => /^chromium-\d+$/.test(c)).sort().reverse()
    : [];
  for (const carpeta of carpetas) {
    const app = path.join(cache, carpeta, "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing");
    if (fs.existsSync(app)) return app;
  }
  throw new Error("No encontré el navegador. Pon su ruta en CHROME.");
}

export function lanzarNavegador() {
  return chromium.launch({ executablePath: chromeInstalado(), headless: true });
}

/** Un celular nuevo (375 px), con o sin sesión abierta. */
export async function celular(navegador, sesion) {
  const contexto = await navegador.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  if (sesion) {
    await contexto.addCookies([
      { name: "proinshop_sesion", value: sesion, domain: new URL(BASE).hostname, path: "/", httpOnly: true },
    ]);
  }
  return contexto;
}

export async function abrir({ ancho = 375, alto = 812 } = {}) {
  const sesion = process.env.PROINSHOP_SESION;
  if (!sesion) throw new Error("Falta PROINSHOP_SESION (una sesión de la base local).");
  const navegador = await lanzarNavegador();
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2 });
  await contexto.addCookies([
    { name: "proinshop_sesion", value: sesion, domain: new URL(BASE).hostname, path: "/", httpOnly: true },
  ]);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  return { navegador, contexto, pagina, errores };
}

export const paso = (texto) => console.log(`\n▶ ${texto}`);
export const ok = (texto) => console.log(`  ✓ ${texto}`);
export const mal = (texto) => {
  console.log(`  ✗ ${texto}`);
  process.exitCode = 1;
};
