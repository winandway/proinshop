"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { baseDeDatos } from "@/lib/d1";
import { anotarActividad } from "@/lib/actividad";
import { costoPromedio } from "@/lib/inventario";
import { formatearPrecio } from "@/lib/i18n";
import { leerMonto } from "@/lib/numeros";
import { usuarioQuePuede } from "@/lib/sesion";

export type ResultadoCompra = { error?: string };

type LineaCompra = { productoId: number; varianteId?: number | null; cantidad: number; costo: string | number };

const METODOS = ["efectivo", "transferencia", "tarjeta", "credito"];

/**
 * Registra la mercancía que llegó del proveedor: suma el stock (del producto
 * y de la variante), recalcula el costo promedio y deja el movimiento en el
 * historial. Si se pagó en efectivo, sale de la caja.
 */
export async function registrarCompra(
  _previo: ResultadoCompra,
  datos: FormData,
): Promise<ResultadoCompra> {
  const usuario = await usuarioQuePuede("compras");
  if (!usuario) return { error: "Tu cuenta no tiene permiso para registrar compras" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  let lineas: LineaCompra[];
  try {
    lineas = JSON.parse(String(datos.get("lineas") ?? "[]"));
  } catch {
    return { error: "No se pudo leer la compra" };
  }
  lineas = (Array.isArray(lineas) ? lineas : []).filter((l) => Number(l.productoId) > 0);
  if (lineas.length === 0) return { error: "Agrega al menos un producto" };

  const metodo = String(datos.get("metodo_pago") ?? "efectivo");
  if (!METODOS.includes(metodo)) return { error: "Elige cómo pagaste la compra" };

  const ids = [...new Set(lineas.map((l) => Number(l.productoId)))];
  const marcas = ids.map(() => "?").join(",");
  const [{ results: productos }, { results: variantes }] = await Promise.all([
    db
      .prepare(
        `SELECT id, nombre_es, costo, stock, COALESCE(es_servicio, 0) AS es_servicio FROM producto WHERE id IN (${marcas})`,
      )
      .bind(...ids)
      .all<{ id: number; nombre_es: string; costo: number; stock: number; es_servicio: number }>(),
    db
      .prepare(`SELECT id, producto_id, nombre_es FROM variante WHERE producto_id IN (${marcas})`)
      .bind(...ids)
      .all<{ id: number; producto_id: number; nombre_es: string }>(),
  ]);

  let total = 0;
  const detalle: {
    producto: (typeof productos)[number];
    variante: (typeof variantes)[number] | null;
    cantidad: number;
    costo: number;
  }[] = [];

  for (const linea of lineas) {
    const producto = productos.find((p) => p.id === Number(linea.productoId));
    if (!producto) return { error: "Uno de los productos ya no existe" };
    if (producto.es_servicio) return { error: `"${producto.nombre_es}" es un servicio: no lleva stock` };
    const varianteId = Number(linea.varianteId) || null;
    const variante = varianteId
      ? (variantes.find((v) => v.id === varianteId && v.producto_id === producto.id) ?? null)
      : null;
    const cantidad = Math.round(Number(linea.cantidad) || 0);
    if (cantidad <= 0) return { error: `Escribe cuántas unidades de "${producto.nombre_es}" llegaron` };
    const costo = Math.max(0, leerMonto(linea.costo));
    total += cantidad * costo;
    detalle.push({ producto, variante, cantidad, costo });
  }

  const compra = await db
    .prepare(
      `INSERT INTO compra (proveedor_id, usuario_id, factura, total, nota, metodo_pago)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      Number(datos.get("proveedor_id")) || null,
      usuario.id,
      String(datos.get("factura") ?? "").trim().slice(0, 60) || null,
      Math.round(total * 100) / 100,
      String(datos.get("nota") ?? "").trim().slice(0, 300) || null,
      metodo,
    )
    .run();
  const compraId = Number(compra.meta.last_row_id);

  const operaciones = [];
  for (const { producto, variante, cantidad, costo } of detalle) {
    // Se recalcula en orden: si llegan dos líneas del mismo producto, la
    // segunda parte del stock y el costo que dejó la primera.
    const nuevoCosto = costoPromedio(producto.stock, producto.costo, cantidad, costo);
    producto.stock += cantidad;
    producto.costo = nuevoCosto;

    const descripcion = variante ? `${producto.nombre_es} (${variante.nombre_es})` : producto.nombre_es;
    operaciones.push(
      db
        .prepare(
          `INSERT INTO compra_item (compra_id, producto_id, variante_id, descripcion, cantidad, costo_unit)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(compraId, producto.id, variante?.id ?? null, descripcion, cantidad, costo),
      db
        .prepare("UPDATE producto SET stock = ?, costo = ? WHERE id = ?")
        .bind(producto.stock, nuevoCosto, producto.id),
      db
        .prepare(
          `INSERT INTO movimiento_inventario
             (producto_id, variante_id, motivo, cantidad, stock_final, usuario_id, referencia)
           VALUES (?, ?, 'compra', ?, ?, ?, ?)`,
        )
        .bind(producto.id, variante?.id ?? null, cantidad, producto.stock, usuario.id, `Compra #${compraId}`),
    );
    if (variante) {
      operaciones.push(
        db.prepare("UPDATE variante SET stock = stock + ? WHERE id = ?").bind(cantidad, variante.id),
      );
    }
  }
  await db.batch(operaciones);

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "compra",
    detalle: `Registró la compra #${compraId} (${detalle.length} producto${detalle.length === 1 ? "" : "s"}) por ${formatearPrecio(total)}`,
    monto: total,
    enlace: "/panel/compras",
  });

  revalidatePath("/panel/compras");
  revalidatePath("/panel/inventario");
  revalidatePath("/");
  redirect(`/panel/compras?registrada=${compraId}`);
}
