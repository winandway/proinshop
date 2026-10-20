"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { D1Database } from "@cloudflare/workers-types";
import { baseDeDatos } from "@/lib/d1";
import { valorAleatorio } from "@/lib/contrasenas";
import { nombreDelDispositivo, sitioDeLlave, type SitioDeLlave } from "@/lib/llaves";
import { crearSesion, usuarioActual } from "@/lib/sesion";

/**
 * Entrar con huella o cara (llaves de acceso).
 *
 * El celular o la computadora guarda una llave privada que nunca sale de ahí;
 * aquí solo queda la pública. Para entrar, el servidor manda un reto, el
 * dispositivo lo firma después de pedir la huella o la cara, y aquí se
 * comprueba la firma. No hay contraseña que robar ni que adivinar.
 */

const COOKIE_RETO = "proinshop_reto";
const MINUTOS_DEL_RETO = 5;

type ConOpciones<T> = { opciones?: T; error?: string };
export type ResultadoLlave = { ok?: boolean; error?: string };

async function sitioActual(): Promise<SitioDeLlave | null> {
  const cabeceras = await headers();
  const origen = cabeceras.get("origin") ?? `https://${cabeceras.get("host") ?? ""}`;
  return sitioDeLlave(origen);
}

/** El reto vive en la base, no en la cookie: así no se puede reutilizar. */
async function guardarReto(db: D1Database, reto: string, usuarioId: number | null) {
  const id = valorAleatorio(16);
  await db.batch([
    db.prepare("DELETE FROM reto_llave WHERE expira < datetime('now')"),
    db
      .prepare(
        `INSERT INTO reto_llave (id, reto, usuario_id, expira)
         VALUES (?, ?, ?, datetime('now', ?))`,
      )
      .bind(id, reto, usuarioId, `+${MINUTOS_DEL_RETO} minutes`),
  ]);
  (await cookies()).set(COOKIE_RETO, id, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/panel",
    maxAge: MINUTOS_DEL_RETO * 60,
  });
}

/** Devuelve el reto y lo borra: cada reto sirve una sola vez. */
async function tomarReto(db: D1Database, usuarioId: number | null): Promise<string | null> {
  const almacen = await cookies();
  const id = almacen.get(COOKIE_RETO)?.value;
  almacen.delete({ name: COOKIE_RETO, path: "/panel" });
  if (!id) return null;

  const fila = await db
    .prepare("SELECT reto, usuario_id FROM reto_llave WHERE id = ? AND expira > datetime('now')")
    .bind(id)
    .first<{ reto: string; usuario_id: number | null }>();
  await db.prepare("DELETE FROM reto_llave WHERE id = ?").bind(id).run();

  if (!fila || fila.usuario_id !== usuarioId) return null;
  return fila.reto;
}

// ─── Entrar ────────────────────────────────────────────────────────────────

export async function opcionesParaEntrar(): Promise<ConOpciones<PublicKeyCredentialRequestOptionsJSON>> {
  const db = await baseDeDatos();
  const sitio = await sitioActual();
  if (!db || !sitio) return { error: "La huella no está disponible en esta dirección." };

  // Sin lista de llaves: el dispositivo ofrece las que tenga para este sitio,
  // así la persona ni siquiera escribe su correo.
  const opciones = await generateAuthenticationOptions({
    rpID: sitio.rpID,
    userVerification: "required",
    timeout: 120_000,
  });
  await guardarReto(db, opciones.challenge, null);
  return { opciones };
}

export async function entrarConLlave(respuesta: AuthenticationResponseJSON): Promise<ResultadoLlave> {
  const db = await baseDeDatos();
  const sitio = await sitioActual();
  if (!db || !sitio) return { error: "La huella no está disponible en esta dirección." };

  const reto = await tomarReto(db, null);
  if (!reto) return { error: "Pasó demasiado tiempo. Toca el botón otra vez." };

  const llave = await db
    .prepare(
      `SELECT l.id, l.usuario_id, l.clave_publica, l.contador, l.transportes, u.activo
       FROM llave_acceso l JOIN usuario u ON u.id = l.usuario_id
       WHERE l.id = ?`,
    )
    .bind(String(respuesta?.id ?? ""))
    .first<{
      id: string;
      usuario_id: number;
      clave_publica: string;
      contador: number;
      transportes: string | null;
      activo: number;
    }>();

  if (!llave) {
    return {
      error:
        "Esta huella ya no está registrada aquí. Entra con tu correo y contraseña, y vuelve a activarla en Mi cuenta.",
    };
  }
  if (llave.activo !== 1) return { error: "Esta cuenta está desactivada" };

  let verificada;
  try {
    verificada = await verifyAuthenticationResponse({
      response: respuesta,
      expectedChallenge: reto,
      expectedOrigin: sitio.origen,
      expectedRPID: sitio.rpID,
      requireUserVerification: true,
      credential: {
        id: llave.id,
        publicKey: isoBase64URL.toBuffer(llave.clave_publica),
        counter: llave.contador,
        transports: llave.transportes ? JSON.parse(llave.transportes) : undefined,
      },
    });
  } catch (error) {
    console.error("Proinshop: no se pudo comprobar la huella", error);
    return { error: "No pudimos comprobar tu huella. Vuelve a intentarlo." };
  }
  if (!verificada.verified) return { error: "No pudimos comprobar tu huella. Vuelve a intentarlo." };

  await db.batch([
    db
      .prepare("UPDATE llave_acceso SET contador = ?, ultimo_uso = datetime('now') WHERE id = ?")
      .bind(verificada.authenticationInfo.newCounter, llave.id),
    db.prepare("UPDATE usuario SET ultimo_acceso = datetime('now') WHERE id = ?").bind(llave.usuario_id),
  ]);

  const agente = (await headers()).get("user-agent") ?? undefined;
  await crearSesion(llave.usuario_id, agente);
  return { ok: true };
}

// ─── Activar en Mi cuenta ─────────────────────────────────────────────────

export async function opcionesParaRegistrar(): Promise<ConOpciones<PublicKeyCredentialCreationOptionsJSON>> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció. Vuelve a entrar." };
  const db = await baseDeDatos();
  const sitio = await sitioActual();
  if (!db || !sitio) return { error: "La huella no está disponible en esta dirección." };

  const { results: existentes } = await db
    .prepare("SELECT id, transportes FROM llave_acceso WHERE usuario_id = ?")
    .bind(usuario.id)
    .all<{ id: string; transportes: string | null }>();

  const opciones = await generateRegistrationOptions({
    rpName: "Proinshop",
    rpID: sitio.rpID,
    userName: usuario.correo || usuario.nombre,
    userDisplayName: usuario.nombre,
    // Siempre el mismo para la misma persona: si activa la huella dos veces
    // en el mismo celular, la nueva reemplaza a la vieja en vez de duplicarse.
    userID: new TextEncoder().encode(`proinshop-${usuario.id}`),
    attestationType: "none",
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    excludeCredentials: existentes.map((llave) => ({
      id: llave.id,
      transports: llave.transportes ? JSON.parse(llave.transportes) : undefined,
    })),
    timeout: 120_000,
  });
  await guardarReto(db, opciones.challenge, usuario.id);
  return { opciones };
}

export async function guardarLlave(respuesta: RegistrationResponseJSON): Promise<ResultadoLlave> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció. Vuelve a entrar." };
  const db = await baseDeDatos();
  const sitio = await sitioActual();
  if (!db || !sitio) return { error: "La huella no está disponible en esta dirección." };

  const reto = await tomarReto(db, usuario.id);
  if (!reto) return { error: "Pasó demasiado tiempo. Toca el botón otra vez." };

  let verificada;
  try {
    verificada = await verifyRegistrationResponse({
      response: respuesta,
      expectedChallenge: reto,
      expectedOrigin: sitio.origen,
      expectedRPID: sitio.rpID,
      requireUserVerification: true,
    });
  } catch (error) {
    console.error("Proinshop: no se pudo activar la huella", error);
    return { error: "No pudimos activar la huella. Vuelve a intentarlo." };
  }
  if (!verificada.verified) return { error: "No pudimos activar la huella. Vuelve a intentarlo." };

  const { credential } = verificada.registrationInfo;
  const agente = (await headers()).get("user-agent");
  await db
    .prepare(
      `INSERT OR REPLACE INTO llave_acceso (id, usuario_id, clave_publica, contador, transportes, nombre)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      credential.id,
      usuario.id,
      isoBase64URL.fromBuffer(credential.publicKey),
      credential.counter,
      credential.transports ? JSON.stringify(credential.transports) : null,
      nombreDelDispositivo(agente),
    )
    .run();

  revalidatePath("/panel/cuenta");
  return { ok: true };
}

export async function quitarLlave(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  const db = await baseDeDatos();
  if (!usuario || !db) return;
  // Solo las propias: el id viene del formulario y no se confía en él.
  await db
    .prepare("DELETE FROM llave_acceso WHERE id = ? AND usuario_id = ?")
    .bind(String(datos.get("id") ?? ""), usuario.id)
    .run();
  revalidatePath("/panel/cuenta");
}
