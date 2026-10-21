"use server";

import { baseDeDatos } from "@/lib/d1";
import { obtenerConfigTienda } from "@/lib/config-tienda";
import { avisarPorDetras } from "@/lib/avisos-push";
import { formatearPrecio } from "@/lib/i18n";
import { filasPorLista } from "@/lib/por-trozos";

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
}): Promise<ResultadoPedido> {
  const db = await baseDeDatos();
  if (!db) return { error: "No se pudo conectar con la tienda" };

  if (!datos.cliente.nombre.trim() || !datos.cliente.celular.trim()) {
    return { error: "Faltan tus datos de contacto" };
  }
  if (datos.lineas.length === 0) return { error: "El carrito está vacío" };

  const slugs = datos.lineas.map((l) => l.productoSlug);
  // Solo lo publicado se puede pedir: un producto escondido no se vende
  // aunque alguien arme el pedido a mano.
  const productos = await filasPorLista<{ id: number; slug: string; nombre_es: string; precio: number }>(
    db,
    (marcas) => `SELECT id, slug, nombre_es, precio FROM producto WHERE publicado = 1 AND slug IN (${marcas})`,
    slugs,
  );

  // El color, la talla o la potencia que eligió el cliente viajan con el
  // pedido. Antes se perdían: el dueño no sabía qué variante despachar y el
  // recargo de la variante no se cobraba.
  const idsVariante = datos.lineas
    .map((l) => l.varianteId)
    .filter((id): id is number => Number.isInteger(id) && (id as number) > 0);
  const variantes = idsVariante.length
    ? await filasPorLista<{ id: number; producto_id: number; nombre_es: string; precio_extra: number }>(
        db,
        (marcas) => `SELECT id, producto_id, nombre_es, precio_extra FROM variante WHERE id IN (${marcas})`,
        idsVariante,
      )
    : [];

  // Los precios salen de la base, nunca del navegador.
  let subtotal = 0;
  const items: {
    productoId: number;
    varianteId: number | null;
    descripcion: string;
    cantidad: number;
    precio: number;
  }[] = [];

  for (const linea of datos.lineas) {
    const producto = productos.find((p) => p.slug === linea.productoSlug);
    if (!producto) continue;
    const variante =
      variantes.find((v) => v.id === linea.varianteId && v.producto_id === producto.id) ?? null;
    const cantidad = Math.min(999, Math.max(1, Math.round(linea.cantidad)));
    const precio = producto.precio + (variante?.precio_extra ?? 0);
    subtotal += precio * cantidad;
    items.push({
      productoId: producto.id,
      varianteId: variante?.id ?? null,
      descripcion: variante ? `${producto.nombre_es} (${variante.nombre_es})` : producto.nombre_es,
      cantidad,
      precio,
    });
  }

  if (items.length === 0) return { error: "Los productos del carrito ya no están disponibles" };

  // El envío también sale del panel: si viniera del navegador, cualquiera
  // podría mandarlo en cero.
  const config = await obtenerConfigTienda();
  const envio = datos.entrega === "domicilio" ? Math.max(0, config.costoEnvio) : 0;
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
        `INSERT INTO pedido_item (pedido_id, producto_id, variante_id, descripcion, cantidad, precio_unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(pedidoId, item.productoId, item.varianteId, item.descripcion, item.cantidad, item.precio)
      .run();
  }

  // Al celular de quien atiende los pedidos, aunque tenga el panel cerrado.
  // Sin hacer esperar al cliente que está comprando.
  await avisarPorDetras(
    db,
    { modulo: "pedidos" },
    {
      titulo: "🛒 Nuevo pedido en la tienda",
      cuerpo: `#${numero} de ${datos.cliente.nombre.trim()} · ${formatearPrecio(total)}`.slice(0, 180),
      enlace: `/panel/pedidos/${pedidoId}`,
      etiqueta: `pedido-${pedidoId}`,
    },
  );

  return { numero };
}
