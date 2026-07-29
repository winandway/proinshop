"use server";

import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { valorAleatorio } from "@/lib/contrasenas";
import { usuarioActual, type Rol } from "@/lib/sesion";

export type ResultadoEquipo = { error?: string; codigo?: string };

const ROLES: Rol[] = ["dueno", "vendedor", "bodega"];
const DIAS_INVITACION = 7;

/** Crea el enlace de invitación. Solo el propietario puede sumar gente. */
export async function invitar(
  _previo: ResultadoEquipo,
  datos: FormData,
): Promise<ResultadoEquipo> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció" };
  if (usuario.rol !== "dueno") return { error: "Solo el propietario puede invitar" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const nombre = String(datos.get("nombre") ?? "").trim();
  const rol = String(datos.get("rol") ?? "") as Rol;
  if (!ROLES.includes(rol)) return { error: "Elige un rol válido" };

  const codigo = valorAleatorio(16);

  await db
    .prepare(
      `INSERT INTO invitacion (codigo, negocio_id, nombre, rol, expira, creada_por)
       VALUES (?, ?, ?, ?, datetime('now', ?), ?)`,
    )
    .bind(codigo, usuario.negocioId, nombre || null, rol, `+${DIAS_INVITACION} days`, usuario.id)
    .run();

  revalidatePath("/panel/equipo");
  return { codigo };
}

export async function cambiarActivo(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "dueno") return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  // Nadie puede desactivarse a sí mismo: dejaría el negocio sin quien entre.
  if (!id || id === usuario.id) return;

  await db
    .prepare("UPDATE usuario SET activo = 1 - activo WHERE id = ? AND negocio_id = ?")
    .bind(id, usuario.negocioId)
    .run();

  // Al desactivar, se cierran sus sesiones: si no, seguiría dentro con la
  // cookie que ya tenía hasta que venciera.
  await db
    .prepare("DELETE FROM sesion WHERE usuario_id = ? AND (SELECT activo FROM usuario WHERE id = ?) = 0")
    .bind(id, id)
    .run();

  revalidatePath("/panel/equipo");
}

export async function anularInvitacion(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "dueno") return;

  const db = await baseDeDatos();
  if (!db) return;

  await db
    .prepare("DELETE FROM invitacion WHERE codigo = ? AND negocio_id = ?")
    .bind(String(datos.get("codigo") ?? ""), usuario.negocioId)
    .run();

  revalidatePath("/panel/equipo");
}
