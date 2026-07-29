"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { baseDeDatos } from "@/lib/d1";
import {
  cifrarContrasena,
  nuevaSal,
  revisarContrasena,
  verificarContrasena,
} from "@/lib/contrasenas";
import { COOKIE_SESION, usuarioActual } from "@/lib/sesion";

export type ResultadoCuenta = { error?: string; listo?: string };

export async function cambiarContrasena(
  _previo: ResultadoCuenta,
  datos: FormData,
): Promise<ResultadoCuenta> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const actual = String(datos.get("actual") ?? "");
  const nueva = String(datos.get("nueva") ?? "");
  const repetida = String(datos.get("repetida") ?? "");

  const fila = await db
    .prepare("SELECT contrasena_hash, sal FROM usuario WHERE id = ?")
    .bind(usuario.id)
    .first<{ contrasena_hash: string; sal: string }>();

  if (!fila) return { error: "No se encontró tu cuenta" };

  // Se pide la contraseña actual para que nadie cambie la clave desde una
  // sesión abierta que se quedó olvidada en otro dispositivo.
  const correcta = await verificarContrasena(actual, fila.sal, fila.contrasena_hash);
  if (!correcta) return { error: "Tu contraseña actual no es correcta" };

  if (nueva !== repetida) return { error: "Las dos contraseñas nuevas no coinciden" };
  const problema = revisarContrasena(nueva);
  if (problema) return { error: problema };

  const sal = nuevaSal();
  const hash = await cifrarContrasena(nueva, sal);

  await db
    .prepare("UPDATE usuario SET contrasena_hash = ?, sal = ? WHERE id = ?")
    .bind(hash, sal, usuario.id)
    .run();

  // Cambiar la contraseña cierra las demás sesiones: es lo que uno espera
  // cuando la cambia justamente porque sospecha que alguien más entró.
  const almacen = await cookies();
  const sesionActual = almacen.get(COOKIE_SESION)?.value ?? "";
  await db
    .prepare("DELETE FROM sesion WHERE usuario_id = ? AND id != ?")
    .bind(usuario.id, sesionActual)
    .run();

  revalidatePath("/panel/cuenta");
  return { listo: "Contraseña cambiada. Se cerraron tus otras sesiones." };
}

export async function cerrarOtrasSesiones(): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const almacen = await cookies();
  const sesionActual = almacen.get(COOKIE_SESION)?.value ?? "";

  await db
    .prepare("DELETE FROM sesion WHERE usuario_id = ? AND id != ?")
    .bind(usuario.id, sesionActual)
    .run();

  revalidatePath("/panel/cuenta");
}
