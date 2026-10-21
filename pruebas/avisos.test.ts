import { describe, expect, it } from "vitest";
import { buildPushPayload } from "@block65/webcrypto-web-push";
import { llavePublicaDesdeJwk, servicioPermitido } from "@/lib/avisos-push";

const b64u = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64u = (texto: string) =>
  Uint8Array.from(atob(texto.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const unir = (...partes: Uint8Array[]) => {
  const salida = new Uint8Array(partes.reduce((suma, p) => suma + p.length, 0));
  let i = 0;
  for (const parte of partes) {
    salida.set(parte, i);
    i += parte.length;
  }
  return salida;
};
const texto = (s: string) => new TextEncoder().encode(s);
/** Copia a un ArrayBuffer propio, que es lo que piden las funciones de cifrado. */
const ab = (bytes: Uint8Array) => bytes.slice().buffer as ArrayBuffer;

async function hkdf(sal: Uint8Array, ikm: Uint8Array, info: Uint8Array, largo: number) {
  const llave = await crypto.subtle.importKey("raw", ab(ikm), "HKDF", false, ["deriveBits"]);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: ab(sal), info: ab(info) }, llave, largo * 8),
  );
}

/** Lo que hace el celular al recibir el aviso (RFC 8291), para comprobar el cifrado. */
async function descifrar(cuerpo: Uint8Array, privadaCelular: CryptoKey, publicaCelular: Uint8Array, auth: Uint8Array) {
  const sal = cuerpo.slice(0, 16);
  const largoId = cuerpo[20]!;
  const publicaServidor = cuerpo.slice(21, 21 + largoId);
  const cifrado = cuerpo.slice(21 + largoId);
  const llaveServidor = await crypto.subtle.importKey("raw", ab(publicaServidor), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const secreto = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: llaveServidor }, privadaCelular, 256),
  );
  const ikm = await hkdf(auth, secreto, unir(texto("WebPush: info\0"), publicaCelular, publicaServidor), 32);
  const cek = await hkdf(sal, ikm, texto("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(sal, ikm, texto("Content-Encoding: nonce\0"), 12);
  const llave = await crypto.subtle.importKey("raw", ab(cek), "AES-GCM", false, ["decrypt"]);
  const claro = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: ab(nonce) }, llave, ab(cifrado)));
  let fin = claro.length - 1;
  while (fin > 0 && claro[fin] === 0) fin -= 1;
  expect(claro[fin]).toBe(2); // delimitador del último registro
  return new TextDecoder().decode(claro.slice(0, fin));
}

describe("avisos al celular", () => {
  it("solo se mandan a los servicios de avisos de los navegadores", () => {
    expect(servicioPermitido("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(servicioPermitido("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true);
    expect(servicioPermitido("https://web.push.apple.com/QW1")).toBe(true);
    expect(servicioPermitido("https://wns2-bl2p.notify.windows.com/w/?token=x")).toBe(true);
    expect(servicioPermitido("http://fcm.googleapis.com/fcm/send/abc")).toBe(false);
    expect(servicioPermitido("https://fcm.googleapis.com.evil.net/x")).toBe(false);
    expect(servicioPermitido("https://localhost/x")).toBe(false);
    expect(servicioPermitido(42)).toBe(false);
  });

  it("la llave pública sale en el formato que pide el navegador", async () => {
    const par = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"])) as CryptoKeyPair;
    const jwk = await crypto.subtle.exportKey("jwk", par.privateKey);
    const publica = deB64u(llavePublicaDesdeJwk(jwk));
    const cruda = new Uint8Array(await crypto.subtle.exportKey("raw", par.publicKey));
    expect(publica.length).toBe(65);
    expect(publica[0]).toBe(4);
    expect(b64u(publica)).toBe(b64u(cruda));
  });

  it("el aviso va cifrado y firmado, y el celular lo puede leer", async () => {
    const servidor = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"])) as CryptoKeyPair;
    const privadaJwk = await crypto.subtle.exportKey("jwk", servidor.privateKey);
    const celular = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
    const publicaCelular = new Uint8Array(await crypto.subtle.exportKey("raw", celular.publicKey));
    const auth = crypto.getRandomValues(new Uint8Array(16));
    const aviso = { titulo: "🛒 Nuevo pedido", cuerpo: "#1001 de Carlos · $229", enlace: "/panel/pedidos/1", etiqueta: "pedido-1" };

    const publicaServidor = llavePublicaDesdeJwk(privadaJwk);
    const peticion = await buildPushPayload(
      { data: aviso, options: { ttl: 86_400, urgency: "high", topic: "pedido-1" } },
      {
        endpoint: "https://fcm.googleapis.com/fcm/send/abc",
        expirationTime: null,
        keys: { p256dh: b64u(publicaCelular), auth: b64u(auth) },
      },
      { subject: "mailto:soporte@windoce.com", publicKey: publicaServidor, privateKey: privadaJwk.d },
    );

    // El formato nuevo, el único que aceptan los iPhone.
    expect(peticion.headers["content-encoding"]).toBe("aes128gcm");
    expect(peticion.headers.ttl).toBe("86400");
    expect(peticion.headers.authorization).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/);
    expect(peticion.headers.authorization).toContain(`k=${publicaServidor}`);

    const leido = await descifrar(peticion.body, celular.privateKey, publicaCelular, auth);
    expect(JSON.parse(leido)).toEqual(aviso);
  });
});
