"use server";

import { baseDeDatos } from "@/lib/d1";

export type LineaPedido = {
  productoSlug: string;
  varianteId: number | null;
  cantidad: number;
};

export type ResultadoPedido = { numero?: string; error?: string };

/**
 * Guarda el pedido de la tienda en la base.
 *
 * Antes el pedido vivía solo en el navegador del cliente: si cerraba la
 * pestaña, el negocio nunca se enteraba de que alguien quiso comprar.
 */
export async function guardarPedido(datos: {
  cliente: { nombre: string; celular: string; correo: string; direccion: string };
  entrega: "domicilio" | "local";
  pago: "transferencia" | "tarjeta" | "contraentrega";
  lineas: LineaPedido[];
  envio: number;
}): Promise<ResultadoPedido> {
  const db = await baseDeDatos();
  if (!db) return { error: "No se pudo conectar con la tienda" };

  if (!datos.cliente.nombre.trim() || !datos.cliente.celular.trim()) {
    return { error: "Faltan tus datos de contacto" };
  }
  if (datos.lineas.length === 0) return { error: "El carrito está vacío" };

  const slugs = datos.lineas.map((l) => l.productoSlug);
  const marcas = slugs.map(() => "?").join(",");
  const { results: productos } = await db
    .prepare(`SELECT id, slug, nombre_es, precio FROM producto WHERE slug IN (${marcas})`)
    .bind(...slugs)
    .all<{ id: number; slug: string; nombre_es: string; precio: number }>();

  // Los precios salen de la base, nunca del navegador.
  let subtotal = 0;
  const items: { productoId: number; descripcion: string; cantidad: number; precio: number }[] = [];

  for (const linea of datos.lineas) {
    const producto = productos.find((p) => p.slug === linea.productoSlug);
    if (!producto) continue;
    const cantidad = Math.max(1, Math.round(linea.cantidad));
    subtotal += producto.precio * cantidad;
    items.push({
      productoId: producto.id,
      descripcion: producto.nombre_es,
      cantidad,
      precio: producto.precio,
    });
  }

  if (items.length === 0) return { error: "Los productos del carrito ya no están disponibles" };

  const envio = datos.entrega === "domicilio" ? Math.max(0, datos.envio) : 0;
  const total = subtotal + envio;

  // Número correlativo y legible para el dueño y el cliente.
  const ultimo = await db
    .prepare("SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 1000) AS ultimo FROM pedido")
    .first<{ ultimo: number }>();
  const numero = String((ultimo?.ultimo ?? 1000) + 1);

  const pedido = await db
    .prepare(
      `INSERT INTO pedido
         (numero, estado, cliente_nombre, cliente_telefono, cliente_correo, direccion,
          entrega, metodo_pago, subtotal, envio, total)
       VALUES (?, 'nuevo', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      numero,
      datos.cliente.nombre.trim(),
      datos.cliente.celular.trim(),
      datos.cliente.correo.trim() || null,
      datos.cliente.direccion.trim() || null,
      datos.entrega,
      datos.pago,
      subtotal,
      envio,
      total,
    )
    .run();

  const pedidoId = Number(pedido.meta.last_row_id);

  for (const item of items) {
    await db
      .prepare(
        `INSERT INTO pedido_item (pedido_id, producto_id, descripcion, cantidad, precio_unit)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(pedidoId, item.productoId, item.descripcion, item.cantidad, item.precio)
      .run();
  }

  return { numero };
}
