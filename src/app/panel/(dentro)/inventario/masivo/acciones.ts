"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { baseDeDatos } from "@/lib/d1";
import { anotarActividad } from "@/lib/actividad";
import { leerMonto } from "@/lib/numeros";
import { usuarioActual, usuarioQuePuede } from "@/lib/sesion";
import { cambiarPorLista } from "@/lib/por-trozos";
import { MAXIMO_A_LA_VEZ, borrarProductos } from "@/lib/borrar-productos";

const ACCIONES = ["categoria", "publicar", "ocultar", "precio", "destacar", "quitar_destacado", "minimo"];

/**
 * Edición masiva, como en Treinta: se eligen varios productos y se les cambia
 * de una vez la categoría, la visibilidad, el precio (subir o bajar un
 * porcentaje), el destacado o el mínimo de stock.
 */
export async function aplicarMasivo(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("inventario");
  if (!usuario) return;
  const db = await baseDeDatos();
  if (!db) return;

  const ids = datos
    .getAll("ids")
    .map((valor) => Number(valor))
    .filter((id) => id > 0)
    .slice(0, 3000);
  const accion = String(datos.get("accion") ?? "");
  if (ids.length === 0 || !ACCIONES.includes(accion)) redirect("/panel/inventario/masivo?nada=1");

  let sql = "";
  let valores: (string | number | null)[] = [];
  let detalle = "";

  if (accion === "categoria") {
    sql = "UPDATE producto SET categoria_id = ? WHERE id IN (%s)";
    valores = [Number(datos.get("categoria_id")) || null];
    detalle = "cambió la categoría";
  } else if (accion === "publicar" || accion === "ocultar") {
    sql = `UPDATE producto SET publicado = ${accion === "publicar" ? 1 : 0} WHERE id IN (%s)`;
    detalle = accion === "publicar" ? "publicó en la tienda" : "quitó de la tienda";
  } else if (accion === "destacar" || accion === "quitar_destacado") {
    sql = `UPDATE producto SET destacado = ${accion === "destacar" ? 1 : 0} WHERE id IN (%s)`;
    detalle = accion === "destacar" ? "destacó en la portada" : "quitó de destacados";
  } else if (accion === "precio") {
    const porcentaje = leerMonto(datos.get("porcentaje"));
    if (!porcentaje || porcentaje <= -100) redirect("/panel/inventario/masivo?nada=1");
    sql = "UPDATE producto SET precio = ROUND(precio * ?, 2) WHERE id IN (%s)";
    valores = [1 + porcentaje / 100];
    detalle = `${porcentaje > 0 ? "subió" : "bajó"} el precio ${Math.abs(porcentaje)} %`;
  } else if (accion === "minimo") {
    sql = "UPDATE producto SET stock_minimo = ? WHERE id IN (%s)";
    valores = [Math.max(0, Math.round(leerMonto(datos.get("minimo"))))];
    detalle = "cambió el aviso de stock";
  }

  // Por trozos: con más de cien productos marcados, una sola consulta no pasa.
  await cambiarPorLista(db, (marcas) => sql.replace("%s", marcas), ids, valores);

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "masivo",
    detalle: `Edición masiva: ${detalle} a ${ids.length} productos`,
    enlace: "/panel/inventario",
  });

  revalidatePath("/panel/inventario");
  revalidatePath("/");
  redirect(`/panel/inventario?masivo=${ids.length}`);
}

/**
 * Borrar los marcados de una vez (por ejemplo, los productos de muestra). Solo
 * el propietario, igual que el borrado de uno solo, y siempre después de
 * confirmar en los tres puntos.
 */
export async function eliminarSeleccionados(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "dueno") return;
  const db = await baseDeDatos();
  if (!db) return;

  const ids = [
    ...new Set(
      datos
        .getAll("ids")
        .map((valor) => Number(valor))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
  if (ids.length === 0) redirect("/panel/inventario/masivo?nada=1");
  if (ids.length > MAXIMO_A_LA_VEZ) redirect("/panel/inventario/masivo?muchos=1");

  await borrarProductos(db, ids);
  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "masivo",
    detalle: `Borró ${ids.length} productos de una vez`,
    enlace: "/panel/inventario",
  });

  revalidatePath("/panel/inventario");
  revalidatePath("/");
  redirect(`/panel/inventario?borrados=${ids.length}`);
}
