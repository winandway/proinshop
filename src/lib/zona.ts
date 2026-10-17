import { cookies } from "next/headers";

/**
 * La hora del negocio.
 *
 * La base guarda todo en hora universal. Sin esto, el "hoy" del panel se
 * cerraba a medianoche de Londres: a las 8 de la noche en América las ventas
 * del día desaparecían del resumen y las horas salían corridas. El navegador
 * del dueño dice su diferencia horaria (cookie que pone `ZonaHoraria`) y aquí
 * se usa para cortar los días y mostrar las horas.
 */

export const COOKIE_ZONA = "proinshop_zona";

/** Minutos de diferencia con la hora universal (−300 en Bogotá, −240 en Caracas). */
export async function minutosZona(): Promise<number> {
  const valor = Number((await cookies()).get(COOKIE_ZONA)?.value);
  if (!Number.isFinite(valor)) return 0;
  return Math.max(-720, Math.min(840, Math.round(valor)));
}

/**
 * Modificador de SQLite que pasa una fecha universal a la hora del negocio,
 * por ejemplo '-300 minutes'. Sale de un número entero ya acotado, nunca de
 * texto del usuario: por eso se puede escribir dentro de la consulta.
 */
export async function modificadorZona(): Promise<string> {
  const minutos = await minutosZona();
  return `'${minutos >= 0 ? "+" : ""}${minutos} minutes'`;
}

/** "2026-10-17 01:15:00" (universal) → "2026-10-16 20:15" en la hora del negocio. */
export function horaLocal(fechaUniversal: string, minutos: number): string {
  const fecha = new Date(`${fechaUniversal.replace(" ", "T").slice(0, 19)}Z`);
  if (Number.isNaN(fecha.getTime())) return fechaUniversal.slice(0, 16).replace("T", " ");
  return new Date(fecha.getTime() + minutos * 60_000).toISOString().slice(0, 16).replace("T", " ");
}
