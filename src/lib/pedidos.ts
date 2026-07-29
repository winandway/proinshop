/**
 * Lectura del pedido desde la base.
 *
 * El seguimiento vivía solo en el navegador que compró: si el cliente abría
 * el enlace en el celular, o se lo pasaba a alguien, no veía nada. Ahora sale
 * de la base y el estado que muestra es el real, el que puso el dueño.
 */

import { baseDeDatos } from "./d1";

export type PedidoPublico = {
  numero: string;
  fecha: string;
  estado: "nuevo" | "preparando" | "enviado" | "entregado" | "cancelado";
  entrega: "domicilio" | "local";
  subtotal: number;
  envio: number;
  total: number;
  lineas: { descripcion: string; cantidad: number; precioUnitario: number }[];
};

export async function obtenerPedidoPublico(numero: string): Promise<PedidoPublico | null> {
  const db = await baseDeDatos();
  if (!db) return null;

  const pedido = await db
    .prepare(
      `SELECT id, numero, fecha, estado, entrega, subtotal, envio, total
       FROM pedido WHERE numero = ?`,
    )
    .bind(numero)
    .first<{
      id: number;
      numero: string;
      fecha: string;
      estado: string;
      entrega: string;
      subtotal: number;
      envio: number;
      total: number;
    }>()
    .catch(() => null);

  if (!pedido) return null;

  const { results } = await db
    .prepare(
      "SELECT descripcion, cantidad, precio_unit FROM pedido_item WHERE pedido_id = ?",
    )
    .bind(pedido.id)
    .all<{ descripcion: string; cantidad: number; precio_unit: number }>();

  return {
    numero: pedido.numero,
    fecha: pedido.fecha,
    estado: pedido.estado as PedidoPublico["estado"],
    entrega: pedido.entrega as PedidoPublico["entrega"],
    subtotal: pedido.subtotal,
    envio: pedido.envio,
    total: pedido.total,
    lineas: results.map((r) => ({
      descripcion: r.descripcion,
      cantidad: r.cantidad,
      precioUnitario: r.precio_unit,
    })),
  };
}
