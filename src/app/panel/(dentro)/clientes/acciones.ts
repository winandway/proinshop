"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { baseDeDatos } from "@/lib/d1";
import { usuarioQuePuede } from "@/lib/sesion";

export async function editarCliente(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("clientes");
  if (!usuario) return;
  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const nombre = String(datos.get("nombre") ?? "").trim();
  if (!id || nombre.length < 2) return;

  await db
    .prepare("UPDATE cliente SET nombre = ?, telefono = ?, correo = ?, direccion = ?, nota = ? WHERE id = ?")
    .bind(
      nombre,
      String(datos.get("telefono") ?? "").trim() || null,
      String(datos.get("correo") ?? "").trim() || null,
      String(datos.get("direccion") ?? "").trim() || null,
      String(datos.get("nota") ?? "").trim().slice(0, 500) || null,
      id,
    )
    .run();

  revalidatePath(`/panel/clientes/${id}`);
  revalidatePath("/panel/clientes");
  redirect(`/panel/clientes/${id}?guardado=1`);
}

/**
 * Elimina un cliente que no debe nada. Sus compras se conservan en el balance
 * sin su nombre. Si tiene deuda, no se deja: borrarlo borraría la deuda.
 */
export async function eliminarCliente(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("clientes");
  if (!usuario) return;
  const db = await baseDeDatos();
  if (!db) return;

  const id = Number(datos.get("id"));
  const deuda = await db
    .prepare("SELECT COALESCE(SUM(saldo), 0) AS debe FROM deuda WHERE cliente_id = ?")
    .bind(id)
    .first<{ debe: number }>();
  if ((deuda?.debe ?? 0) > 0) redirect(`/panel/clientes/${id}?debe=1`);

  await db.batch([
    db.prepare("UPDATE venta SET cliente_id = NULL WHERE cliente_id = ?").bind(id),
    db.prepare("UPDATE cotizacion SET cliente_id = NULL WHERE cliente_id = ?").bind(id),
    db.prepare("DELETE FROM abono WHERE deuda_id IN (SELECT id FROM deuda WHERE cliente_id = ?)").bind(id),
    db.prepare("DELETE FROM deuda WHERE cliente_id = ?").bind(id),
    db.prepare("DELETE FROM cliente WHERE id = ?").bind(id),
  ]);

  revalidatePath("/panel/clientes");
  redirect("/panel/clientes?eliminado=1");
}
