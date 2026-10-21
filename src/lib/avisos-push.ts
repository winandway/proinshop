import type { D1Database } from "@cloudflare/workers-types";
import { buildPushPayload } from "@block65/webcrypto-web-push";
import { leerPermisos, puedeUsar, type Modulo, type Rol } from "./permisos";

/**
 * Avisos al celular aunque el panel esté cerrado (notificaciones push), como
 * los de Treinta: entra un pedido de la tienda, un empleado vende o cierra la
 * caja, y al dueño le suena el celular.
 *
 * Las llaves para firmar los avisos las crea el propio sistema la primera vez
 * y quedan en la base: no dependen de ninguna configuración a mano.
 *
 * El cifrado es el estándar actual (aes128gcm, RFC 8291), el único que
 * aceptan los iPhone. No cambiar a una librería con el formato viejo
 * (aesgcm): a los iPhone no les llegaría nada. Candado C-AVISOS.
 */

export type Aviso = {
  titulo: string;
  cuerpo: string;
  /** Adónde lleva al tocarlo. */
  enlace: string;
  /** Dos avisos con la misma etiqueta no se amontonan: el nuevo reemplaza al viejo. */
  etiqueta: string;
};

/** A quién le llega: los que pueden usar ese módulo, solo los propietarios o una persona. */
export type Destino = { modulo: Modulo } | { soloPropietarios: true } | { usuarioId: number };

/**
 * Solo se manda a los servicios de avisos de los navegadores. Si alguien
 * guardara otra dirección, el servidor no le hace peticiones a ella.
 */
const SERVICIOS = [
  /^fcm\.googleapis\.com$/,
  /^([a-z0-9-]+\.)*push\.services\.mozilla\.com$/,
  /^([a-z0-9-]+\.)*notify\.windows\.com$/,
  /^([a-z0-9-]+\.)*push\.apple\.com$/,
];

export function servicioPermitido(endpoint: unknown): boolean {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return false;
  try {
    const direccion = new URL(endpoint);
    return direccion.protocol === "https:" && SERVICIOS.some((patron) => patron.test(direccion.hostname));
  } catch {
    return false;
  }
}

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const desdeBase64url = (texto: string) =>
  Uint8Array.from(atob(texto.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** La llave pública como la pide el navegador: el punto sin comprimir, en base64url. */
export function llavePublicaDesdeJwk(jwk: JsonWebKey): string {
  const x = desdeBase64url(jwk.x ?? "");
  const y = desdeBase64url(jwk.y ?? "");
  const punto = new Uint8Array(1 + x.length + y.length);
  punto[0] = 4;
  punto.set(x, 1);
  punto.set(y, 1 + x.length);
  return base64url(punto);
}

/** La llave privada para firmar. La primera vez se crea y se guarda. */
// Las tablas las crea src/lib/esquema.ts al arrancar.
export async function llavesAviso(db: D1Database): Promise<{ privada: JsonWebKey; publica: string }> {
  let fila = await db.prepare("SELECT privada FROM clave_aviso WHERE id = 1").first<{ privada: string }>();
  if (!fila) {
    const par = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
      "sign",
      "verify",
    ])) as CryptoKeyPair;
    const privada = await crypto.subtle.exportKey("jwk", par.privateKey);
    // Si dos procesos la crean a la vez, gana la primera y los dos usan esa.
    await db
      .prepare("INSERT OR IGNORE INTO clave_aviso (id, privada) VALUES (1, ?)")
      .bind(JSON.stringify(privada))
      .run();
    fila = await db.prepare("SELECT privada FROM clave_aviso WHERE id = 1").first<{ privada: string }>();
  }
  const privada = JSON.parse(fila!.privada) as JsonWebKey;
  return { privada, publica: llavePublicaDesdeJwk(privada) };
}

type FilaSuscripcion = {
  endpoint: string;
  p256dh: string;
  auth: string;
  usuario_id: number;
  rol: string;
  permisos: string | null;
};

/**
 * Manda el aviso a todos los celulares de las personas que corresponden.
 * Nunca rompe lo que lo llamó: un aviso que no sale no puede tumbar una venta
 * ni un pedido. Los fallos quedan en el registro y en la cuenta de fallos.
 */
export async function enviarAviso(
  db: D1Database,
  destino: Destino,
  aviso: Aviso,
  excepto?: number,
): Promise<{ enviados: number; fallidos: number }> {
  let enviados = 0;
  let fallidos = 0;
  try {
    const { results } = await db
      .prepare(
        `SELECT s.endpoint, s.p256dh, s.auth, s.usuario_id, u.rol, u.permisos
         FROM suscripcion_aviso s JOIN usuario u ON u.id = s.usuario_id
         WHERE u.activo = 1`,
      )
      .all<FilaSuscripcion>();

    const elegidas = results.filter((fila) => {
      if (excepto && fila.usuario_id === excepto) return false;
      if ("soloPropietarios" in destino) return fila.rol === "dueno";
      if ("usuarioId" in destino) return fila.usuario_id === destino.usuarioId;
      return puedeUsar({ rol: fila.rol as Rol, permisos: leerPermisos(fila.permisos) }, destino.modulo);
    });
    if (elegidas.length === 0) return { enviados, fallidos };

    const { privada, publica } = await llavesAviso(db);
    const vapid = { subject: "mailto:soporte@windoce.com", publicKey: publica, privateKey: privada.d };
    await Promise.all(
      elegidas.map(async (fila) => {
        if (!servicioPermitido(fila.endpoint)) return;
        try {
          const peticion = await buildPushPayload(
            {
              data: aviso,
              options: { ttl: 86_400, urgency: "high", topic: aviso.etiqueta.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) },
            },
            {
              endpoint: fila.endpoint,
              expirationTime: null,
              keys: { p256dh: fila.p256dh, auth: fila.auth },
            },
            vapid,
          );
          const respuesta = await fetch(fila.endpoint, {
            method: "POST",
            headers: peticion.headers,
            body: peticion.body,
          });
          if (respuesta.status === 404 || respuesta.status === 410) {
            // El celular ya no existe o quitó el permiso: se deja de mandar.
            await db.prepare("DELETE FROM suscripcion_aviso WHERE endpoint = ?").bind(fila.endpoint).run();
            return;
          }
          if (!respuesta.ok) throw new Error(`servicio de avisos respondió ${respuesta.status}`);
          enviados += 1;
          await db
            .prepare("UPDATE suscripcion_aviso SET ultimo = datetime('now'), fallos = 0 WHERE endpoint = ?")
            .bind(fila.endpoint)
            .run();
        } catch (error) {
          fallidos += 1;
          console.error("Proinshop: no salió un aviso al celular", error);
          await db
            .prepare("UPDATE suscripcion_aviso SET fallos = fallos + 1 WHERE endpoint = ?")
            .bind(fila.endpoint)
            .run();
        }
      }),
    );
  } catch (error) {
    console.error("Proinshop: no se pudieron mandar los avisos", error);
  }
  return { enviados, fallidos };
}

/**
 * Manda el aviso sin hacer esperar a quien lo provocó (el cliente que compra,
 * el vendedor que cobra): la nube lo termina de mandar por detrás.
 */
export async function avisarPorDetras(
  db: D1Database,
  destino: Destino,
  aviso: Aviso,
  excepto?: number,
): Promise<void> {
  const tarea = enviarAviso(db, destino, aviso, excepto);
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const contexto = await getCloudflareContext({ async: true });
    if (contexto?.ctx?.waitUntil) {
      contexto.ctx.waitUntil(tarea);
      return;
    }
  } catch {
    // Fuera de la nube: se espera aquí mismo.
  }
  await tarea;
}
