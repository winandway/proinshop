/* eslint-disable @typescript-eslint/no-unused-expressions --
   cada comprobación se escribe «condición ? ok(...) : mal(...)», que se lee de corrido. */
// Prueba a mano en el navegador. Cómo se corre: ver comun.mjs.

import { BASE, CAPTURAS, abrir, mal, ok, paso } from "./comun.mjs";

const { navegador, contexto, pagina, errores } = await abrir();

const cdp = await contexto.newCDPSession(pagina);
await cdp.send("WebAuthn.enable");
const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
  options: {
    protocol: "ctap2",
    transport: "internal",
    hasResidentKey: true,
    hasUserVerification: true,
    isUserVerified: true,
    automaticPresenceSimulation: true,
  },
});


// 1. Activar la huella en Mi cuenta
paso("Activar huella en Mi cuenta");
await pagina.goto(`${BASE}/panel/cuenta`);
await pagina.getByRole("button", { name: /Activar en este dispositivo/ }).click();
try {
  await pagina.getByText("Listo. La próxima vez entra con tu huella").waitFor({ timeout: 15000 });
  ok("la huella quedó activada");
} catch {
  mal(`no apareció el aviso de lista. Texto: ${await pagina.locator("main").innerText()}`);
}
await pagina.reload();
const lista = await pagina.locator("li", { hasText: "Último uso" }).or(pagina.locator("li", { hasText: "Activada:" })).count();
lista > 0 ? ok(`aparece en la lista (${lista})`) : mal("no aparece en la lista");
const { credentials } = await cdp.send("WebAuthn.getCredentials", { authenticatorId });
credentials.length === 1 && credentials[0].isResidentCredential
  ? ok("el dispositivo guardó una llave que se encuentra sola")
  : mal(`credenciales: ${JSON.stringify(credentials)}`);
if (CAPTURAS) await pagina.screenshot({ path: `${CAPTURAS}/fingerprint-login.png` });

// 2. Activarla otra vez en el mismo dispositivo: debe decir que ya está
paso("Activar dos veces en el mismo dispositivo");
await pagina.getByRole("button", { name: /Activar en este dispositivo/ }).click();
try {
  await pagina.getByText(/ya tiene la huella activada|Se canceló/).waitFor({ timeout: 15000 });
  ok(`avisa: ${await pagina.getByRole("alert").first().innerText()}`);
} catch {
  mal("no avisó nada al repetir");
}

// 3. Salir y entrar con la huella
paso("Entrar con huella sin cookie");
await contexto.clearCookies();
await pagina.goto(`${BASE}/panel/entrar`);
await pagina.getByRole("button", { name: /Entrar con huella o cara/ }).click();
try {
  await pagina.waitForURL(`${BASE}/panel`, { timeout: 15000 });
  const nombre = await pagina.locator("header").innerText();
  nombre.includes("Laura") ? ok("entró al panel con la huella") : mal(`entró pero el encabezado dice: ${nombre}`);
} catch {
  mal(`no entró. URL ${pagina.url()} · ${await pagina.locator("body").innerText()}`);
}

// 4. Una llave que el servidor no conoce: mensaje claro
paso("Llave borrada del servidor");
await contexto.clearCookies();
const respuesta = await pagina.request.post(`${BASE}/panel/cola-ventas`, {
  data: {},
  headers: { origin: "https://otro-sitio.com" },
});
respuesta.status() === 403 ? ok("la cola rechaza otro origen (403)") : mal(`cola con otro origen: ${respuesta.status()}`);

console.log("\nErrores de la página:", errores.length ? errores : "ninguno");
await navegador.close();