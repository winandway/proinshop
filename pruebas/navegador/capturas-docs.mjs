// Toma las capturas de las guías de Docs que muestran Mi cuenta. Se corre a
// mano contra la copia local, con la franja de trabajo apagada en esa base.
// Cómo se corre: ver comun.mjs.
import { BASE, abrir, ok } from "./comun.mjs";

const SALIDA = process.env.CAPTURAS ?? "docs/capturas";
const { navegador, pagina } = await abrir();
await pagina.goto(`${BASE}/panel/cuenta`);
await pagina.waitForLoadState("networkidle");
// Next vuelve la página arriba al terminar de cargar: se espera a que pase.
await pagina.waitForTimeout(1500);

for (const [titulo, archivo] of [
  ["Proinshop en tu celular", "install-the-app.png"],
  ["Avisos en este celular", "phone-alerts.png"],
]) {
  // La sección arriba de la pantalla, con un poco de aire.
  // Sin animación: la página tiene desplazamiento suave y la captura saldría a medio camino.
  await pagina.getByRole("heading", { name: titulo }).evaluate((titular) =>
    window.scrollTo({ top: titular.getBoundingClientRect().top + window.scrollY - 40, behavior: "instant" }),
  );
  await pagina.waitForTimeout(400);
  await pagina.screenshot({ path: `${SALIDA}/${archivo}` });
  ok(archivo);
}
await navegador.close();
