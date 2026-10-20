import type { D1Database } from "@cloudflare/workers-types";
import { anotarActividad } from "./actividad";
import { NOMBRE_METODO } from "./metodos";
import { leerMonto } from "./numeros";
import { claveDeVentaValida, fechaDeVentaSinSenal, repartirPagos } from "./ventas";

type LineaVenta = { productoId: number; varianteId?: number | null; cantidad: number };

/** Lo que llega del formulario o de la cola, todavía sin revisar. */
export type EntradaVenta = {
  lineas: unknown;
  pagos: unknown;
  clienteId: unknown;
  descuento: unknown;
  nota: unknown;
  /** Llave única de la venta: si llega dos veces, se guarda una sola. */
  clave?: unknown;
  /** Solo en ventas hechas sin señal: cuándo se vendió de verdad. */
  fecha?: unknown;
  /**
   * Venta hecha sin señal: la mercancía ya salió de la tienda. Si mientras
   * tanto se vendió lo mismo en otro lado, se registra igual (el stock queda
   * en cero) en vez de perder una venta que sí ocurrió.
   */
  sinSenal?: boolean;
};

export type VentaGuardada = { id: number; repetida?: boolean } | { error: string };

function leerJson(valor: unknown): unknown {
  if (typeof valor !== "string") return valor ?? [];
  return JSON.parse(valor || "[]");
}

/**
 * Registra la venta y mueve todo lo que depende de ella: descuenta stock
 * (del producto y de la variante), anota el movimiento de inventario, guarda
 * cómo se pagó y, si una parte fue fiada, crea la deuda por esa parte.
 *
 * Los precios, costos y existencias se leen de la base: nada de eso se toma
 * del navegador, que se puede manipular.
 */
export async function guardarVenta(
  db: D1Database,
  usuarioId: number,
  entrada: EntradaVenta,
): Promise<VentaGuardada> {
  let lineas: LineaVenta[];
  let pagosPedidos: unknown;
  try {
    lineas = leerJson(entrada.lineas) as LineaVenta[];
    pagosPedidos = leerJson(entrada.pagos);
  } catch {
    return { error: "No se pudo leer la venta" };
  }
  if (!Array.isArray(lineas) || lineas.length === 0) {
    return { error: "Agrega al menos un producto" };
  }

  // La misma venta reenviada (doble toque, o la cola que reintenta) no se
  // guarda dos veces: se devuelve la que ya existe.
  const clave = claveDeVentaValida(entrada.clave);
  if (clave) {
    const existente = await db
      .prepare("SELECT id FROM venta WHERE clave = ?")
      .bind(clave)
      .first<{ id: number }>();
    if (existente) return { id: existente.id, repetida: true };
  }

  const clienteId = Number(entrada.clienteId) || null;
  const descuentoPedido = Math.max(0, leerMonto(entrada.descuento));
  const nota = String(entrada.nota ?? "").trim().slice(0, 200) || null;
  const fecha = entrada.sinSenal ? fechaDeVentaSinSenal(entrada.fecha) : null;

  const ids = [...new Set(lineas.map((l) => Number(l?.productoId)).filter(Boolean))];
  if (ids.length === 0) return { error: "Agrega al menos un producto" };
  const marcas = ids.map(() => "?").join(",");
  const [{ results: productos }, { results: variantes }] = await Promise.all([
    db
      .prepare(
        `SELECT id, nombre_es, precio, costo, stock, COALESCE(es_servicio, 0) AS es_servicio
         FROM producto WHERE id IN (${marcas})`,
      )
      .bind(...ids)
      .all<{ id: number; nombre_es: string; precio: number; costo: number; stock: number; es_servicio: number }>(),
    db
      .prepare(
        `SELECT id, producto_id, nombre_es, stock, precio_extra FROM variante WHERE producto_id IN (${marcas})`,
      )
      .bind(...ids)
      .all<{ id: number; producto_id: number; nombre_es: string; stock: number; precio_extra: number }>(),
  ]);

  // Se juntan las líneas del mismo producto y la misma variante.
  const juntas = new Map<string, { productoId: number; varianteId: number | null; cantidad: number }>();
  for (const linea of lineas) {
    const productoId = Number(linea?.productoId);
    const varianteId = Number(linea?.varianteId) || null;
    const cantidad = Math.max(1, Math.round(Number(linea?.cantidad) || 0));
    const k = `${productoId}:${varianteId ?? ""}`;
    const previa = juntas.get(k);
    juntas.set(k, { productoId, varianteId, cantidad: (previa?.cantidad ?? 0) + cantidad });
  }

  let subtotal = 0;
  const detalle: {
    producto: (typeof productos)[number];
    variante: (typeof variantes)[number] | null;
    cantidad: number;
    precio: number;
  }[] = [];

  for (const { productoId, varianteId, cantidad } of juntas.values()) {
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return { error: "Uno de los productos ya no existe" };
    const variante = varianteId
      ? (variantes.find((v) => v.id === varianteId && v.producto_id === productoId) ?? null)
      : null;
    if (varianteId && !variante) return { error: `Elige otra opción de "${producto.nombre_es}"` };

    // Los servicios no tienen existencias; los productos sí.
    if (!producto.es_servicio && !entrada.sinSenal) {
      const disponible = variante ? variante.stock : producto.stock;
      if (cantidad > disponible) {
        const nombre = variante ? `${producto.nombre_es} (${variante.nombre_es})` : producto.nombre_es;
        return { error: `Solo quedan ${disponible} de "${nombre}"` };
      }
    }

    const precio = producto.precio + (variante?.precio_extra ?? 0);
    subtotal += precio * cantidad;
    detalle.push({ producto, variante, cantidad, precio });
  }

  const descuento = Math.min(subtotal, descuentoPedido);
  const total = Math.round((subtotal - descuento) * 100) / 100;

  const cobro = repartirPagos(pagosPedidos, total);
  if ("error" in cobro) return { error: cobro.error };
  if (cobro.fiado > 0 && !clienteId) {
    return { error: "Para dejar algo fiado tienes que elegir el cliente" };
  }

  let venta;
  try {
    venta = await db
      .prepare(
        `INSERT INTO venta (fecha, canal, cliente_id, usuario_id, metodo_pago, subtotal, descuento, total, pagada, nota, clave)
         VALUES (COALESCE(?, datetime('now')), 'local', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        fecha,
        clienteId,
        usuarioId,
        cobro.metodo,
        subtotal,
        descuento,
        total,
        cobro.fiado > 0 ? 0 : 1,
        nota,
        clave,
      )
      .run();
  } catch (error) {
    // Dos envíos de la misma venta al mismo tiempo: el segundo choca con la
    // llave única y se devuelve la que ganó.
    if (clave && String(error).includes("UNIQUE")) {
      const ganadora = await db
        .prepare("SELECT id FROM venta WHERE clave = ?")
        .bind(clave)
        .first<{ id: number }>();
      if (ganadora) return { id: ganadora.id, repetida: true };
    }
    throw error;
  }

  const ventaId = Number(venta.meta.last_row_id);
  const operaciones = [
    ...cobro.pagos.map((pago) =>
      db
        .prepare("INSERT INTO venta_pago (venta_id, metodo, monto) VALUES (?, ?, ?)")
        .bind(ventaId, pago.metodo, pago.monto),
    ),
  ];

  for (const { producto, variante, cantidad, precio } of detalle) {
    const descripcion = variante ? `${producto.nombre_es} (${variante.nombre_es})` : producto.nombre_es;
    operaciones.push(
      db
        .prepare(
          `INSERT INTO venta_item (venta_id, producto_id, variante_id, descripcion, cantidad, precio_unit, costo_unit)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(ventaId, producto.id, variante?.id ?? null, descripcion, cantidad, precio, producto.costo),
    );

    if (!producto.es_servicio) {
      if (variante) {
        operaciones.push(
          db.prepare("UPDATE variante SET stock = MAX(0, stock - ?) WHERE id = ?").bind(cantidad, variante.id),
        );
      }
      const stockFinal = Math.max(0, producto.stock - cantidad);
      producto.stock = stockFinal;
      operaciones.push(
        db.prepare("UPDATE producto SET stock = ? WHERE id = ?").bind(stockFinal, producto.id),
        db
          .prepare(
            `INSERT INTO movimiento_inventario
               (producto_id, variante_id, motivo, cantidad, stock_final, usuario_id, referencia)
             VALUES (?, ?, 'venta', ?, ?, ?, ?)`,
          )
          .bind(producto.id, variante?.id ?? null, -cantidad, stockFinal, usuarioId, `Venta #${ventaId}`),
      );
    }
  }

  if (cobro.fiado > 0 && clienteId) {
    operaciones.push(
      db
        .prepare(
          `INSERT INTO deuda (cliente_id, venta_id, monto, saldo, vence)
           VALUES (?, ?, ?, ?, date('now', '+30 days'))`,
        )
        .bind(clienteId, ventaId, cobro.fiado, cobro.fiado),
    );
  }

  // Todo lo que depende de la venta va junto: o queda todo, o no queda nada.
  try {
    await db.batch(operaciones);
  } catch (error) {
    // Sin sus productos la venta no vale: se quita, para que el reintento
    // la guarde completa en vez de encontrarla a medias por su llave.
    await db.prepare("DELETE FROM venta WHERE id = ?").bind(ventaId).run();
    throw error;
  }

  await anotarActividad({
    usuarioId,
    tipo: "venta",
    detalle: `Venta #${ventaId} · ${cobro.pagos.map((p) => NOMBRE_METODO[p.metodo] ?? p.metodo).join(" + ")}${
      entrada.sinSenal ? " · hecha sin señal" : ""
    }`,
    monto: total,
    enlace: `/panel/vender/${ventaId}`,
  });

  return { id: ventaId };
}
