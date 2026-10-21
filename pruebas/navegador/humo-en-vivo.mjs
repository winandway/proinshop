/* eslint-disable @typescript-eslint/no-unused-expressions --
   cada comprobación se escribe «condición ? ok(...) : mal(...)», que se lee de corrido. */
// Prueba de humo contra el sitio publicado: abre las páginas públicas en un
// celular, sin entrar a ninguna cuenta ni enviar nada, y exige cero errores.
//   PROINSHOP_BASE=https://proinshop.com node pruebas/navegador/humo-en-vivo.mjs
import { BASE, celular, lanzarNavegador, mal, ok, paso } from "./comun.mjs";

const navegador = await lanzarNavegador();
const contexto = await celular(navegador);
const pagina = await contexto.newPage();
const errores = [];
pagina.on("pageerror", (e) => errores.push(`${pagina.url()}: ${e.message}`));
pagina.on("console", (m) => m.type() === "error" && errores.push(`${pagina.url()}: ${m.text()}`));

paso(`Sitio: ${BASE}`);
for (const ruta of ["/", "/catalogo", "/docs", "/docs/phone-alerts", "/panel/crear-cuenta", "/panel/entrar"]) {
  const respuesta = await pagina.goto(`${BASE}${ruta}`);
  await pagina.waitForLoadState("networkidle");
  respuesta?.ok() ? ok(`${ruta} abre (${respuesta.status()})`) : mal(`${ruta} → ${respuesta?.status()}`);
}
await pagina.goto(`${BASE}/catalogo`);
const producto = pagina.locator('a[href^="/producto/"]').first();
if (await producto.count()) {
  await producto.click();
  await pagina.waitForLoadState("networkidle");
  (await pagina.getByRole("button", { name: /Agregar al carrito/ }).count()) > 0
    ? ok(`la ficha de producto abre con su botón de compra (${new URL(pagina.url()).pathname})`)
    : mal("la ficha de producto no tiene botón de compra");
}
const registrado = await pagina.evaluate(() => navigator.serviceWorker.ready.then((r) => Boolean(r.active)));
registrado ? ok("el modo sin señal se instala en el celular") : mal("el modo sin señal no se instaló");
errores.length ? mal(`errores en las páginas: ${errores.join(" | ")}`) : ok("cero errores en las páginas");
await navegador.close();
