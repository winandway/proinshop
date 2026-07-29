"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { baseDeDatos, bucket } from "@/lib/d1";
import { usuarioActual } from "@/lib/sesion";

export type ResultadoGasto = { error?: string };

export async function registrarGasto(
  _previo: ResultadoGasto,
  datos: FormData,
): Promise<ResultadoGasto> {
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión venció" };

  const db = await baseDeDatos();
  if (!db) return { error: "La base de datos no está disponible" };

  const monto = Number(String(datos.get("monto") ?? "").replace(",", "."));
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: "Escribe cuánto gastaste" };
  }

  const categoria = String(datos.get("categoria") ?? "Otra");

  // El recibo es la prueba del gasto: si viene, se guarda en el bucket.
  let claveRecibo: string | null = null;
  const recibo = datos.get("recibo") as File | null;
  if (recibo && recibo.size > 0) {
    const almacen = await bucket();
    if (almacen) {
      const extension = (recibo.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      claveRecibo = `recibos/${Date.now()}.${extension}`;
      await almacen.put(claveRecibo, await recibo.arrayBuffer(), {
        httpMetadata: { contentType: recibo.type || "image/jpeg" },
      });
    }
  }

  await db
    .prepare(
      `INSERT INTO gasto (categoria, proveedor_id, monto, metodo_pago, nota, recibo_r2)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      categoria,
      Number(datos.get("proveedor_id")) || null,
      monto,
      String(datos.get("metodo_pago") ?? "efectivo"),
      String(datos.get("nota") ?? "").trim() || null,
      claveRecibo,
    )
    .run();

  revalidatePath("/panel");
  revalidatePath("/panel/gastos");
  redirect("/panel/gastos");
}

export async function crearProveedor(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const nombre = String(datos.get("nombre") ?? "").trim();
  if (nombre.length < 2) return;

  await db
    .prepare("INSERT INTO proveedor (nombre, telefono, correo, notas) VALUES (?, ?, ?, ?)")
    .bind(
      nombre,
      String(datos.get("telefono") ?? "").trim() || null,
      String(datos.get("correo") ?? "").trim() || null,
      String(datos.get("notas") ?? "").trim() || null,
    )
    .run();

  revalidatePath("/panel/proveedores");
}
