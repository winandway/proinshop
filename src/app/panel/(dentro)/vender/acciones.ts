"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { usuarioActual, usuarioQuePuede } from "@/lib/sesion";
import { anotarActividad } from "@/lib/actividad";
import { guardarVenta } from "@/lib/registrar-venta";

export type ResultadoVenta = { error?: string };

/**
 * La venta desde la pantalla de vender. La regla completa vive en
 * lib/registrar-venta, que también usa la cola de ventas hechas sin señal.
 */
export async function registrarVenta(
  _previo: ResultadoVenta,
  datos: FormData,
): Promise<ResultadoVenta> {
  const usuario = await usuarioQuePuede("vender");
  if (!usuario) return { error: "Tu cuenta no tiene permiso para registrar ventas" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const resultado = await guardarVenta(db, usuario.id, {
    lineas: datos.get("lineas"),
    pagos: datos.get("pagos"),
    clienteId: datos.get("cliente_id"),
    descuento: datos.get("descuento"),
    nota: datos.get("nota"),
    clave: datos.get("clave"),
  });
  if ("error" in resultado) return { error: resultado.error };

  revalidatePath("/panel");
  revalidatePath("/panel/inventario");
  revalidatePath("/");
  redirect(`/panel/vender/${resultado.id}?nueva=1`);
}

/**
 * Anula una venta registrada por error: la mercancía vuelve al inventario, la
 * deuda que había creado se borra y la venta deja de contar en el balance.
 * No se borra: queda marcada como anulada, para que el dueño vea qué pasó.
 */
export async function anularVenta(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("anular");
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const venta = await db
    .prepare("SELECT id, total, canal FROM venta WHERE id = ? AND COALESCE(anulada, 0) = 0")
    .bind(id)
    .first<{ id: number; total: number; canal: string }>();
  if (!venta) return;

  const { results: items } = await db
    .prepare(
      `SELECT vi.producto_id, vi.variante_id, vi.cantidad, COALESCE(p.es_servicio, 0) AS es_servicio
       FROM venta_item vi LEFT JOIN producto p ON p.id = vi.producto_id
       WHERE vi.venta_id = ?`,
    )
    .bind(id)
    .all<{ producto_id: number | null; variante_id: number | null; cantidad: number; es_servicio: number }>();

  const operaciones = [];
  for (const item of items) {
    if (!item.producto_id || item.es_servicio) continue;
    if (item.variante_id) {
      operaciones.push(
        db.prepare("UPDATE variante SET stock = stock + ? WHERE id = ?").bind(item.cantidad, item.variante_id),
      );
    }
    operaciones.push(
      db.prepare("UPDATE producto SET stock = stock + ? WHERE id = ?").bind(item.cantidad, item.producto_id),
      db
        .prepare(
          `INSERT INTO movimiento_inventario
             (producto_id, variante_id, motivo, cantidad, stock_final, usuario_id, referencia)
           VALUES (?, ?, 'devolucion', ?, (SELECT stock FROM producto WHERE id = ?), ?, ?)`,
        )
        .bind(item.producto_id, item.variante_id, item.cantidad, item.producto_id, usuario.id, `Venta #${id} anulada`),
    );
  }
  operaciones.push(
    db.prepare("DELETE FROM abono WHERE deuda_id IN (SELECT id FROM deuda WHERE venta_id = ?)").bind(id),
    db.prepare("DELETE FROM deuda WHERE venta_id = ?").bind(id),
    db.prepare("UPDATE venta SET anulada = 1, pagada = 1 WHERE id = ?").bind(id),
    // Si venía de un pedido de la tienda, el pedido queda cancelado.
    db.prepare("UPDATE pedido SET estado = 'cancelado' WHERE venta_id = ?").bind(id),
  );
  await db.batch(operaciones);

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "anulacion",
    detalle: `Anuló la venta #${id}`,
    monto: -venta.total,
    enlace: `/panel/vender/${id}`,
  });

  revalidatePath("/panel");
  revalidatePath("/panel/inventario");
  revalidatePath(`/panel/vender/${id}`);
  revalidatePath("/");
}

export async function crearCliente(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return;

  await db
    .prepare("INSERT INTO cliente (nombre, telefono, correo, direccion) VALUES (?, ?, ?, ?)")
    .bind(
      nombre,
      String(datos.get("telefono") ?? "").trim() || null,
      String(datos.get("correo") ?? "").trim() || null,
      String(datos.get("direccion") ?? "").trim() || null,
    )
    .run();

  revalidatePath("/panel/clientes");
  revalidatePath("/panel/vender");
}
