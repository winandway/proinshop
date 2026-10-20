"use server";

import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { valorAleatorio } from "@/lib/contrasenas";
import { usuarioActual, type Rol } from "@/lib/sesion";
import { MODULOS } from "@/lib/permisos";

export type ResultadoEquipo = { error?: string; codigo?: string; recuperacion?: string };

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

/** Genera un enlace para que alguien del equipo estrene contraseña. */
export async function generarRecuperacion(
  _previo: ResultadoEquipo,
  datos: FormData,
): Promise<ResultadoEquipo> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció" };
  if (usuario.rol !== "dueno") return { error: "Solo el propietario puede hacer esto" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const id = Number(datos.get("id"));
  if (!id) return { error: "Persona no encontrada" };

  const persona = await db
    .prepare("SELECT id FROM usuario WHERE id = ? AND negocio_id = ?")
    .bind(id, usuario.negocioId)
    .first<{ id: number }>();
  if (!persona) return { error: "Persona no encontrada" };

  // La tabla puede no existir todavía si la migración no se aplicó: se crea
  // sola, que es más seguro que dejar al dueño fuera de su propio panel.
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS recuperacion (
         codigo TEXT PRIMARY KEY,
         usuario_id INTEGER NOT NULL,
         expira TEXT NOT NULL,
         usada INTEGER NOT NULL DEFAULT 0,
         creada_en TEXT NOT NULL DEFAULT (datetime('now'))
       )`,
    )
    .run();

  const codigo = valorAleatorio(16);
  await db
    .prepare(
      "INSERT INTO recuperacion (codigo, usuario_id, expira) VALUES (?, ?, datetime('now', '+2 hours'))",
    )
    .bind(codigo, id)
    .run();

  revalidatePath("/panel/equipo");
  return { recuperacion: codigo };
}

/**
 * Permisos a la medida: el propietario prende o apaga cada módulo para cada
 * persona. Se guardan todos los módulos, así lo que se ve en Equipo es
 * exactamente lo que la persona puede hacer.
 */
export async function guardarPermisos(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "dueno") return;
  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  if (!id || id === usuario.id) return;

  const permisos: Record<string, boolean> = {};
  for (const { clave } of MODULOS) permisos[clave] = datos.get(`permiso_${clave}`) === "on";

  await db
    .prepare("UPDATE usuario SET permisos = ? WHERE id = ? AND negocio_id = ? AND rol != 'dueno'")
    .bind(JSON.stringify(permisos), id, usuario.negocioId)
    .run();

  revalidatePath("/panel/equipo");
}

/** Cambia el rol. Al cambiarlo, los permisos vuelven a los del rol nuevo. */
export async function cambiarRol(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "dueno") return;
  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const rol = String(datos.get("rol") ?? "") as Rol;
  // Nadie se quita su propio rol de propietario: dejaría el negocio sin dueño.
  if (!id || id === usuario.id || !ROLES.includes(rol)) return;

  await db
    .prepare("UPDATE usuario SET rol = ?, permisos = NULL WHERE id = ? AND negocio_id = ?")
    .bind(rol, id, usuario.negocioId)
    .run();

  revalidatePath("/panel/equipo");
}
