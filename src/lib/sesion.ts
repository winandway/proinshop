import { cookies } from "next/headers";
import { baseDeDatos } from "./d1";
import { valorAleatorio } from "./contrasenas";

/**
 * Sesiones del panel.
 *
 * La cookie solo lleva un identificador aleatorio; los datos viven en la
 * tabla `sesion`. Así el dueño puede cerrar la sesión de un empleado aunque
 * el empleado tenga la cookie en su celular.
 */

export const COOKIE_SESION = "proinshop_sesion";
const DIAS_DE_VIDA = 30;

export type Rol = "dueno" | "vendedor" | "bodega";

export type UsuarioSesion = {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  negocioId: number;
};

export async function crearSesion(usuarioId: number, agente?: string): Promise<string> {
  const db = await baseDeDatos();
  if (!db) throw new Error("Base de datos no disponible");

  const id = valorAleatorio(32);

  await db
    .prepare(
      `INSERT INTO sesion (id, usuario_id, expira, agente)
       VALUES (?, ?, datetime('now', ?), ?)`,
    )
    .bind(id, usuarioId, `+${DIAS_DE_VIDA} days`, agente?.slice(0, 200) ?? null)
    .run();

  const almacen = await cookies();
  almacen.set(COOKIE_SESION, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DIAS_DE_VIDA * 24 * 60 * 60,
  });

  return id;
}

/** Usuario de la sesión actual, o null si no hay sesión válida. */
export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const db = await baseDeDatos();
  if (!db) return null;

  const almacen = await cookies();
  const id = almacen.get(COOKIE_SESION)?.value;
  if (!id) return null;

  const fila = await db
    .prepare(
      `SELECT u.id, u.nombre, u.correo, u.rol, u.negocio_id
       FROM sesion s JOIN usuario u ON u.id = s.usuario_id
       WHERE s.id = ? AND s.expira > datetime('now') AND u.activo = 1`,
    )
    .bind(id)
    .first<{
      id: number;
      nombre: string;
      correo: string | null;
      rol: string;
      negocio_id: number;
    }>();

  if (!fila) return null;

  // Marca de uso: sirve para mostrar "última entrada" y para limpiar sesiones
  // abandonadas más adelante.
  await db
    .prepare("UPDATE sesion SET ultimo_uso = datetime('now') WHERE id = ?")
    .bind(id)
    .run();

  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo ?? "",
    rol: fila.rol as Rol,
    negocioId: fila.negocio_id,
  };
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  const id = almacen.get(COOKIE_SESION)?.value;

  if (id) {
    const db = await baseDeDatos();
    await db?.prepare("DELETE FROM sesion WHERE id = ?").bind(id).run();
  }

  almacen.delete(COOKIE_SESION);
}

/** ¿Ya hay alguien registrado? Si no, la primera cuenta es la del dueño. */
export async function hayUsuarios(): Promise<boolean> {
  const db = await baseDeDatos();
  if (!db) return true;

  const fila = await db.prepare("SELECT COUNT(*) AS total FROM usuario").first<{ total: number }>();
  return (fila?.total ?? 0) > 0;
}

const PERMISOS: Record<Rol, string[]> = {
  dueno: ["todo"],
  vendedor: ["ventas", "pedidos", "clientes", "cotizaciones", "inventario:ver"],
  bodega: ["inventario", "productos", "pedidos"],
};

export function puede(rol: Rol, permiso: string): boolean {
  const permisos = PERMISOS[rol] ?? [];
  return permisos.includes("todo") || permisos.includes(permiso);
}

export const NOMBRE_ROL: Record<Rol, string> = {
  dueno: "Propietario",
  vendedor: "Vendedor",
  bodega: "Bodega",
};
