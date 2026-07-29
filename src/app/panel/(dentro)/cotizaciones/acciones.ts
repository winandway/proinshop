"use server";

import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { valorAleatorio } from "@/lib/contrasenas";
import { usuarioActual } from "@/lib/sesion";

export type ResultadoCotizacion = { error?: string; token?: string };

/** Crea una cotización con productos del inventario. */
export async function crearCotizacion(
  _previo: ResultadoCotizacion,
  datos: FormData,
): Promise<ResultadoCotizacion> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  let lineas: { productoId: number; cantidad: number }[];
  try {
    lineas = JSON.parse(String(datos.get("lineas") ?? "[]"));
  } catch {
    return { error: "No se pudo leer la cotización" };
  }
  if (lineas.length === 0) return { error: "Agrega al menos un producto" };

  const ids = lineas.map((l) => l.productoId);
  const marcas = ids.map(() => "?").join(",");
  const { results: productos } = await db
    .prepare(`SELECT id, nombre_es, precio FROM producto WHERE id IN (${marcas})`)
    .bind(...ids)
    .all<{ id: number; nombre_es: string; precio: number }>();

  let total = 0;
  const items = lineas
    .map((linea) => {
      const producto = productos.find((p) => p.id === linea.productoId);
      if (!producto) return null;
      const cantidad = Math.max(1, Math.round(linea.cantidad));
      total += producto.precio * cantidad;
      return { ...producto, cantidad };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Token público: el cliente abre la cotización sin tener cuenta.
  const token = valorAleatorio(16);

  const cotizacion = await db
    .prepare(
      `INSERT INTO cotizacion (cliente_id, estado, total, vence, token_publico)
       VALUES (?, 'enviada', ?, date('now', '+15 days'), ?)`,
    )
    .bind(Number(datos.get("cliente_id")) || null, total, token)
    .run();

  const cotizacionId = Number(cotizacion.meta.last_row_id);

  for (const item of items) {
    await db
      .prepare(
        `INSERT INTO cotizacion_item (cotizacion_id, producto_id, descripcion, cantidad, precio_unit)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(cotizacionId, item.id, item.nombre_es, item.cantidad, item.precio)
      .run();
  }

  revalidatePath("/panel/cotizaciones");
  return { token };
}

export async function cambiarEstadoCotizacion(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const estado = String(datos.get("estado") ?? "");
  if (!id || !["enviada", "aceptada", "vencida"].includes(estado)) return;

  await db.prepare("UPDATE cotizacion SET estado = ? WHERE id = ?").bind(estado, id).run();
  revalidatePath("/panel/cotizaciones");
}
