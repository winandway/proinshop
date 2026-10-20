"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { baseDeDatos } from "@/lib/d1";
import { valorAleatorio } from "@/lib/contrasenas";
import { usuarioQuePuede } from "@/lib/sesion";
import { anotarActividad } from "@/lib/actividad";

export type ResultadoCotizacion = { error?: string; token?: string };

/** Crea una cotización con productos del inventario. */
export async function crearCotizacion(
  _previo: ResultadoCotizacion,
  datos: FormData,
): Promise<ResultadoCotizacion> {
  const usuario = await usuarioQuePuede("cotizaciones");
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
  const usuario = await usuarioQuePuede("cotizaciones");
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const estado = String(datos.get("estado") ?? "");
  if (!id || !["enviada", "aceptada", "vencida"].includes(estado)) return;

  await db.prepare("UPDATE cotizacion SET estado = ? WHERE id = ?").bind(estado, id).run();
  revalidatePath("/panel/cotizaciones");
}

/**
 * El cliente aceptó: la cotización se vuelve venta con los precios que se le
 * cotizaron. Descuenta el stock, guarda cómo pagó y, si fue fiado, crea la
 * deuda. La cotización queda aceptada y enlazada a su venta.
 */
export async function convertirEnVenta(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("vender");
  if (!usuario) return;
  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const metodo = String(datos.get("metodo_pago") ?? "efectivo");
  if (!["efectivo", "transferencia", "tarjeta", "fiado"].includes(metodo)) return;

  const cotizacion = await db
    .prepare("SELECT id, cliente_id, total, venta_id FROM cotizacion WHERE id = ?")
    .bind(id)
    .first<{ id: number; cliente_id: number | null; total: number; venta_id: number | null }>();
  if (!cotizacion || cotizacion.venta_id) redirect("/panel/cotizaciones");
  if (metodo === "fiado" && !cotizacion.cliente_id) redirect(`/panel/cotizaciones?sin_cliente=${id}`);

  const { results: items } = await db
    .prepare(
      `SELECT ci.producto_id, ci.descripcion, ci.cantidad, ci.precio_unit,
              p.stock, p.costo, COALESCE(p.es_servicio, 0) AS es_servicio
       FROM cotizacion_item ci LEFT JOIN producto p ON p.id = ci.producto_id
       WHERE ci.cotizacion_id = ?`,
    )
    .bind(id)
    .all<{
      producto_id: number | null;
      descripcion: string;
      cantidad: number;
      precio_unit: number;
      stock: number | null;
      costo: number | null;
      es_servicio: number;
    }>();

  const sinStock = items.find(
    (item) => item.producto_id && !item.es_servicio && (item.stock ?? 0) < item.cantidad,
  );
  if (sinStock) redirect(`/panel/cotizaciones?sin_stock=${id}`);

  const total = items.reduce((suma, item) => suma + item.precio_unit * item.cantidad, 0);
  const venta = await db
    .prepare(
      `INSERT INTO venta (canal, cliente_id, usuario_id, metodo_pago, subtotal, descuento, total, pagada, nota)
       VALUES ('local', ?, ?, ?, ?, 0, ?, ?, ?)`,
    )
    .bind(cotizacion.cliente_id, usuario.id, metodo, total, total, metodo === "fiado" ? 0 : 1, `Cotización #${id}`)
    .run();
  const ventaId = Number(venta.meta.last_row_id);

  const operaciones = [
    db.prepare("INSERT INTO venta_pago (venta_id, metodo, monto) VALUES (?, ?, ?)").bind(ventaId, metodo, total),
  ];
  for (const item of items) {
    operaciones.push(
      db
        .prepare(
          `INSERT INTO venta_item (venta_id, producto_id, descripcion, cantidad, precio_unit, costo_unit)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(ventaId, item.producto_id, item.descripcion, item.cantidad, item.precio_unit, item.costo ?? 0),
    );
    if (item.producto_id && !item.es_servicio) {
      const final = Math.max(0, (item.stock ?? 0) - item.cantidad);
      operaciones.push(
        db.prepare("UPDATE producto SET stock = ? WHERE id = ?").bind(final, item.producto_id),
        db
          .prepare(
            `INSERT INTO movimiento_inventario (producto_id, motivo, cantidad, stock_final, usuario_id, referencia)
             VALUES (?, 'venta', ?, ?, ?, ?)`,
          )
          .bind(item.producto_id, -item.cantidad, final, usuario.id, `Venta #${ventaId}`),
      );
    }
  }
  if (metodo === "fiado" && cotizacion.cliente_id) {
    operaciones.push(
      db
        .prepare(
          `INSERT INTO deuda (cliente_id, venta_id, monto, saldo, vence) VALUES (?, ?, ?, ?, date('now', '+30 days'))`,
        )
        .bind(cotizacion.cliente_id, ventaId, total, total),
    );
  }
  operaciones.push(
    db.prepare("UPDATE cotizacion SET estado = 'aceptada', venta_id = ? WHERE id = ?").bind(ventaId, id),
  );
  await db.batch(operaciones);

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "venta",
    detalle: `Convirtió la cotización #${id} en la venta #${ventaId}`,
    monto: total,
    enlace: `/panel/vender/${ventaId}`,
  });

  revalidatePath("/panel/cotizaciones");
  revalidatePath("/panel/inventario");
  revalidatePath("/panel");
  redirect(`/panel/vender/${ventaId}?nueva=1`);
}
