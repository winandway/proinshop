"use server";

import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { usuarioActual } from "@/lib/sesion";

/**
 * Confirma el pedido de la tienda: lo convierte en venta, descuenta el stock
 * y lo anota en el inventario. Es el puente entre la tienda y la contabilidad.
 */
export async function confirmarPedido(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  if (!id) return;

  const pedido = await db
    .prepare("SELECT * FROM pedido WHERE id = ? AND estado = 'nuevo'")
    .bind(id)
    .first<{
      id: number;
      numero: string;
      cliente_nombre: string;
      cliente_telefono: string;
      cliente_correo: string | null;
      direccion: string | null;
      metodo_pago: string;
      subtotal: number;
      total: number;
    }>();

  // Si ya se confirmó, no se vuelve a descontar el stock.
  if (!pedido) return;

  const { results: items } = await db
    .prepare("SELECT producto_id, descripcion, cantidad, precio_unit FROM pedido_item WHERE pedido_id = ?")
    .bind(id)
    .all<{
      producto_id: number | null;
      descripcion: string;
      cantidad: number;
      precio_unit: number;
    }>();

  // El cliente de la tienda pasa a la libreta del negocio, para poder
  // volver a venderle y llevarle historial.
  let clienteId: number | null = null;
  const existente = await db
    .prepare("SELECT id FROM cliente WHERE telefono = ?")
    .bind(pedido.cliente_telefono)
    .first<{ id: number }>();

  if (existente) {
    clienteId = existente.id;
  } else {
    const creado = await db
      .prepare("INSERT INTO cliente (nombre, telefono, correo, direccion) VALUES (?, ?, ?, ?)")
      .bind(pedido.cliente_nombre, pedido.cliente_telefono, pedido.cliente_correo, pedido.direccion)
      .run();
    clienteId = Number(creado.meta.last_row_id);
  }

  const venta = await db
    .prepare(
      `INSERT INTO venta (canal, cliente_id, usuario_id, metodo_pago, subtotal, descuento, total, pagada)
       VALUES ('web', ?, ?, ?, ?, 0, ?, 1)`,
    )
    .bind(clienteId, usuario.id, pedido.metodo_pago, pedido.subtotal, pedido.total)
    .run();

  const ventaId = Number(venta.meta.last_row_id);

  for (const item of items) {
    await db
      .prepare(
        `INSERT INTO venta_item (venta_id, producto_id, descripcion, cantidad, precio_unit, costo_unit)
         VALUES (?, ?, ?, ?, ?, COALESCE((SELECT costo FROM producto WHERE id = ?), 0))`,
      )
      .bind(ventaId, item.producto_id, item.descripcion, item.cantidad, item.precio_unit, item.producto_id)
      .run();

    if (item.producto_id) {
      const producto = await db
        .prepare("SELECT stock FROM producto WHERE id = ?")
        .bind(item.producto_id)
        .first<{ stock: number }>();

      const stockFinal = Math.max(0, (producto?.stock ?? 0) - item.cantidad);
      await db
        .prepare("UPDATE producto SET stock = ? WHERE id = ?")
        .bind(stockFinal, item.producto_id)
        .run();

      await db
        .prepare(
          `INSERT INTO movimiento_inventario
             (producto_id, motivo, cantidad, stock_final, usuario_id, referencia)
           VALUES (?, 'pedido', ?, ?, ?, ?)`,
        )
        .bind(item.producto_id, -item.cantidad, stockFinal, usuario.id, `Pedido #${pedido.numero}`)
        .run();
    }
  }

  await db
    .prepare("UPDATE pedido SET estado = 'preparando', venta_id = ? WHERE id = ?")
    .bind(ventaId, id)
    .run();

  revalidatePath("/panel/pedidos");
  revalidatePath("/panel");
  revalidatePath("/panel/inventario");
}

export async function cambiarEstadoPedido(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const estado = String(datos.get("estado") ?? "");
  const permitidos = ["nuevo", "preparando", "enviado", "entregado", "cancelado"];
  if (!id || !permitidos.includes(estado)) return;

  await db.prepare("UPDATE pedido SET estado = ? WHERE id = ?").bind(estado, id).run();

  revalidatePath("/panel/pedidos");
  revalidatePath(`/panel/pedidos/${id}`);
}
