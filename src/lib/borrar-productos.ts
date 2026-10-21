import type { D1Database } from "@cloudflare/workers-types";
import { enTrozos, marcasPara } from "./por-trozos";

/** Cuántos se pueden borrar de una vez sin pasar el límite de consultas de la nube. */
export const MAXIMO_A_LA_VEZ = 400;

/**
 * Borra productos sin dejar nada colgando: las ventas, pedidos, cotizaciones
 * y compras viejas conservan su descripción (el nombre de ese momento) y
 * pierden solo el enlace al producto. Se hace a mano y en orden, sin depender
 * de las cascadas de la base. Todo junto: o se borra todo, o nada.
 */
export async function borrarProductos(db: D1Database, ids: readonly number[]): Promise<void> {
  const pasos = [
    (m: string) => `UPDATE venta_item SET producto_id = NULL, variante_id = NULL WHERE producto_id IN (${m})`,
    (m: string) => `UPDATE pedido_item SET producto_id = NULL, variante_id = NULL WHERE producto_id IN (${m})`,
    (m: string) => `UPDATE cotizacion_item SET producto_id = NULL WHERE producto_id IN (${m})`,
    (m: string) => `UPDATE compra_item SET producto_id = NULL, variante_id = NULL WHERE producto_id IN (${m})`,
    (m: string) => `DELETE FROM movimiento_inventario WHERE producto_id IN (${m})`,
    (m: string) => `DELETE FROM especificacion WHERE producto_id IN (${m})`,
    (m: string) => `DELETE FROM variante WHERE producto_id IN (${m})`,
    (m: string) => `DELETE FROM foto WHERE producto_id IN (${m})`,
    (m: string) => `DELETE FROM producto WHERE id IN (${m})`,
  ];
  if (ids.length === 0) return;
  await db.batch(
    enTrozos(ids).flatMap((trozo) =>
      pasos.map((paso) => db.prepare(paso(marcasPara(trozo.length))).bind(...trozo)),
    ),
  );
}
