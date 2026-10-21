"use server";

import { headers } from "next/headers";
import { baseDeDatos } from "@/lib/d1";
import { enviarAviso, llavesAviso, servicioPermitido } from "@/lib/avisos-push";
import { usuarioActual } from "@/lib/sesion";

/** Activar y probar los avisos al celular desde Mi cuenta. */

const ESTE_FORMATO = /^[A-Za-z0-9_-]{16,200}$/;

export async function clavePublicaAviso(): Promise<{ publica?: string; error?: string }> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció. Vuelve a entrar." };
  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };
  return { publica: (await llavesAviso(db)).publica };
}

export async function guardarSuscripcion(suscripcion: {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}): Promise<{ ok?: boolean; error?: string }> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció. Vuelve a entrar." };
  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const { endpoint } = suscripcion;
  const p256dh = suscripcion.keys?.p256dh;
  const auth = suscripcion.keys?.auth;
  if (!servicioPermitido(endpoint) || typeof p256dh !== "string" || typeof auth !== "string") {
    return { error: "Este navegador no dio una dirección de avisos válida." };
  }
  if (!ESTE_FORMATO.test(p256dh) || !ESTE_FORMATO.test(auth)) {
    return { error: "Este navegador no dio una dirección de avisos válida." };
  }

  const agente = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db
    .prepare(
      `INSERT INTO suscripcion_aviso (endpoint, usuario_id, p256dh, auth, agente)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET usuario_id = excluded.usuario_id,
         p256dh = excluded.p256dh, auth = excluded.auth, agente = excluded.agente, fallos = 0`,
    )
    .bind(endpoint as string, usuario.id, p256dh, auth, agente)
    .run();
  return { ok: true };
}

export async function quitarSuscripcion(endpoint: string): Promise<void> {
  const usuario = await usuarioActual();
  const db = await baseDeDatos();
  if (!usuario || !db) return;
  await db
    .prepare("DELETE FROM suscripcion_aviso WHERE endpoint = ? AND usuario_id = ?")
    .bind(String(endpoint), usuario.id)
    .run();
}

/** Un aviso de prueba a los celulares de quien lo pide, para saber que funciona. */
export async function probarAviso(): Promise<{ enviados?: number; error?: string }> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció. Vuelve a entrar." };
  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };
  const resultado = await enviarAviso(
    db,
    { usuarioId: usuario.id },
    {
      titulo: "🔔 Avisos activados",
      cuerpo: "Así te van a llegar los pedidos de la tienda y lo que haga tu equipo.",
      enlace: "/panel",
      etiqueta: "prueba",
    },
  );
  if (resultado.enviados === 0) {
    return { error: "No pudimos mandar el aviso a este celular. Desactívalos y vuelve a activarlos." };
  }
  return { enviados: resultado.enviados };
}
