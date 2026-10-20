/* eslint-disable @typescript-eslint/no-unused-expressions --
   cada comprobación se escribe «condición ? ok(...) : mal(...)», que se lee de corrido. */
// Prueba a mano en el navegador. Cómo se corre: ver comun.mjs.

import { BASE, CAPTURAS, abrir, mal, ok, paso } from "./comun.mjs";

const { navegador, contexto, pagina, errores } = await abrir();


paso("Con señal: se instala el modo sin señal y se guardan las páginas");
await pagina.goto(`${BASE}/panel`);
await pagina.evaluate(() => navigator.serviceWorker.ready.then(() => true));
await pagina.reload();
const controlado = await pagina.evaluate(() => Boolean(navigator.serviceWorker.controller));
controlado ? ok("el trabajador controla la página") : mal("el trabajador no controla la página");
await pagina.waitForTimeout(7000);
const copias = await pagina.evaluate(async () => {
  const salida = {};
  for (const nombre of await caches.keys()) {
    const cache = await caches.open(nombre);
    salida[nombre] = (await cache.keys()).map((r) => new URL(r.url).pathname).filter((p) => !p.startsWith("/_next"));
  }
  return salida;
});
console.log("  copias:", JSON.stringify(copias));
const paginas = Object.entries(copias).find(([n]) => n.startsWith("proinshop-paginas"))?.[1] ?? [];
paginas.includes("/panel/vender") ? ok("vender quedó guardada por adelantado") : mal("vender no quedó guardada");

paso("Sin señal: abrir vender y cobrar");
await contexto.setOffline(true);
await pagina.goto(`${BASE}/panel/vender`);
const tira = await pagina.getByText(/Sin señal\. Puedes seguir vendiendo/).isVisible().catch(() => false);
tira ? ok("aparece la franja de sin señal") : mal("no aparece la franja de sin señal");
await pagina.getByRole("button", { name: /Taladro inalámbrico 20V/ }).first().click();
await pagina.getByRole("button", { name: /Registrar venta · \$89/ }).click();
try {
  await pagina.getByText(/Venta guardada sin señal\. Se envía sola/).waitFor({ timeout: 8000 });
  ok("la venta se guardó en el dispositivo");
} catch {
  mal(`no se guardó: ${await pagina.locator("main").innerText()}`);
}
const enCola = await pagina.evaluate(() => {
  const llave = Object.keys(localStorage).find((k) => k.startsWith("proinshop:cola-ventas:"));
  return llave ? JSON.parse(localStorage.getItem(llave)) : [];
});
enCola.length === 1 ? ok(`hay 1 venta en la cola (${enCola[0].total})`) : mal(`cola: ${JSON.stringify(enCola)}`);
await pagina.getByText(/guardada sin señal \(/).waitFor({ timeout: 5000 }).catch(() => mal("no se ve el conteo de ventas guardadas"));
if (CAPTURAS) await pagina.screenshot({ path: `${CAPTURAS}/offline-mode.png` });

paso("Sin señal: una página que nunca se abrió");
await pagina.goto(`${BASE}/panel/reportes`).catch(() => {});
const aviso = await pagina.locator("body").innerText();
aviso.includes("Estás sin señal") || aviso.includes("Reportes")
  ? ok(aviso.includes("Estás sin señal") ? "sale la página «Estás sin señal»" : "reportes estaba guardada")
  : mal(`página sin señal: ${aviso.slice(0, 200)}`);

paso("Vuelve la señal: la venta se envía sola");
await pagina.goto(`${BASE}/panel/vender`).catch(() => {});
await contexto.setOffline(false);
try {
  await pagina.getByText(/Se envió 1 venta hecha sin señal/).waitFor({ timeout: 15000 });
  ok("se envió y lo avisa en verde");
} catch {
  mal(`no se envió: ${(await pagina.locator("body").innerText()).slice(0, 400)}`);
}
const restante = await pagina.evaluate(() =>
  Object.keys(localStorage).filter((k) => k.startsWith("proinshop:cola-ventas:")).length,
);
restante === 0 ? ok("la cola quedó vacía") : mal("la cola no se vació");

paso("Reenviar la misma venta no la duplica");
const segunda = await pagina.request.post(`${BASE}/panel/cola-ventas`, {
  data: enCola[0],
  headers: { origin: BASE },
});
const cuerpo = await segunda.json();
cuerpo.repetida === true ? ok(`el servidor la reconoce (venta #${cuerpo.id})`) : mal(`reenvío: ${JSON.stringify(cuerpo)}`);

paso("Salir borra las copias del panel");
await pagina.goto(`${BASE}/panel`);
await pagina.getByRole("button", { name: "Salir" }).click();
await pagina.waitForURL(/\/panel\/entrar/, { timeout: 10000 });
await pagina.waitForTimeout(1500);
const quedan = await pagina.evaluate(async () => (await caches.keys()).filter((n) => n.startsWith("proinshop-paginas")));
quedan.length === 0 ? ok("no quedan copias del panel") : mal(`quedan: ${quedan}`);

console.log("\nErrores de la página:", errores.length ? errores : "ninguno");
await navegador.close();