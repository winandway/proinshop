"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { baseDeDatos } from "@/lib/d1";
import { anotarActividad } from "@/lib/actividad";
import { formatearPrecio } from "@/lib/i18n";
import { usuarioQuePuede } from "@/lib/sesion";

/**
 * Aplica un conteo de inventario: lo que se contó en la bodega pasa a ser el
 * stock, cada diferencia queda en el historial como ajuste y el conteo queda
 * guardado con cuánto valía lo que faltaba o sobraba.
 *
 * Solo se tocan los productos que se contaron: una casilla vacía es «no lo
 * conté», no «hay cero».
 */
export async function aplicarConteo(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("conteo");
  if (!usuario) return;
  const db = await baseDeDatos();
  if (!db) return;

  const productosContados = new Map<number, number>();
  const variantesContadas = new Map<number, number>();
  for (const [nombre, valor] of datos.entries()) {
    const texto = String(valor).trim();
    if (texto === "") continue;
    const numero = Math.max(0, Math.round(Number(texto.replace(",", "."))));
    if (!Number.isFinite(numero)) continue;
    const producto = /^contado_(\d+)$/.exec(nombre);
    const variante = /^contado_v_(\d+)$/.exec(nombre);
    if (producto) productosContados.set(Number(producto[1]), numero);
    if (variante) variantesContadas.set(Number(variante[1]), numero);
  }

  const [{ results: productos }, { results: variantes }] = await Promise.all([
    db
      .prepare("SELECT id, nombre_es, stock, costo FROM producto WHERE COALESCE(es_servicio, 0) = 0")
      .all<{ id: number; nombre_es: string; stock: number; costo: number }>(),
    db
      .prepare("SELECT id, producto_id, nombre_es, stock FROM variante")
      .all<{ id: number; producto_id: number; nombre_es: string; stock: number }>(),
  ]);

  const conteo = await db
    .prepare("INSERT INTO conteo (usuario_id, nota) VALUES (?, ?)")
    .bind(usuario.id, String(datos.get("nota") ?? "").trim().slice(0, 300) || null)
    .run();
  const conteoId = Number(conteo.meta.last_row_id);

  const operaciones = [];
  let contados = 0;
  let diferencias = 0;
  let valor = 0;

  // Primero las variantes: su diferencia también mueve el stock del producto.
  const ajustePorProducto = new Map<number, number>();
  for (const variante of variantes) {
    const contado = variantesContadas.get(variante.id);
    if (contado === undefined) continue;
    contados += 1;
    const diferencia = contado - variante.stock;
    if (diferencia === 0) continue;
    diferencias += 1;
    operaciones.push(db.prepare("UPDATE variante SET stock = ? WHERE id = ?").bind(contado, variante.id));
    ajustePorProducto.set(variante.producto_id, (ajustePorProducto.get(variante.producto_id) ?? 0) + diferencia);
  }

  for (const producto of productos) {
    const contadoDirecto = productosContados.get(producto.id);
    const porVariantes = ajustePorProducto.get(producto.id);
    if (contadoDirecto === undefined && porVariantes === undefined) continue;
    if (contadoDirecto !== undefined) contados += 1;

    const nuevo =
      contadoDirecto !== undefined ? contadoDirecto : Math.max(0, producto.stock + (porVariantes ?? 0));
    const diferencia = nuevo - producto.stock;
    if (diferencia === 0) continue;
    if (contadoDirecto !== undefined) diferencias += 1;
    valor += diferencia * producto.costo;

    operaciones.push(
      db.prepare("UPDATE producto SET stock = ? WHERE id = ?").bind(nuevo, producto.id),
      db
        .prepare(
          `INSERT INTO movimiento_inventario
             (producto_id, motivo, cantidad, stock_final, usuario_id, referencia, nota)
           VALUES (?, 'ajuste', ?, ?, ?, ?, 'Conteo de inventario')`,
        )
        .bind(producto.id, diferencia, nuevo, usuario.id, `Conteo #${conteoId}`),
    );
  }

  operaciones.push(
    db
      .prepare("UPDATE conteo SET productos = ?, diferencias = ?, valor_diferencia = ? WHERE id = ?")
      .bind(contados, diferencias, Math.round(valor * 100) / 100, conteoId),
  );
  await db.batch(operaciones);

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "conteo",
    detalle: `Hizo un conteo de inventario: ${contados} contados, ${diferencias} con diferencia (${formatearPrecio(valor)})`,
    monto: valor,
    enlace: `/panel/inventario/conteo?hecho=${conteoId}`,
  });

  revalidatePath("/panel/inventario");
  redirect(`/panel/inventario/conteo?hecho=${conteoId}`);
}
