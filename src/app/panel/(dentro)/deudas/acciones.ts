"use server";

import { revalidatePath } from "next/cache";
import { baseDeDatos } from "@/lib/d1";
import { usuarioActual } from "@/lib/sesion";

/** Registra un abono y baja el saldo de la deuda. */
export async function registrarAbono(datos: FormData): Promise<void> {
  const usuario = await usuarioActual();
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const deudaId = Number(datos.get("deuda_id"));
  const monto = Number(String(datos.get("monto") ?? "").replace(",", "."));
  if (!deudaId || !Number.isFinite(monto) || monto <= 0) return;

  const deuda = await db
    .prepare("SELECT saldo, venta_id FROM deuda WHERE id = ?")
    .bind(deudaId)
    .first<{ saldo: number; venta_id: number | null }>();
  if (!deuda) return;

  // El abono nunca deja el saldo en negativo, aunque escriban de más.
  const aplicado = Math.min(monto, deuda.saldo);
  const saldoFinal = deuda.saldo - aplicado;

  await db
    .prepare("INSERT INTO abono (deuda_id, monto, metodo_pago) VALUES (?, ?, ?)")
    .bind(deudaId, aplicado, String(datos.get("metodo_pago") ?? "efectivo"))
    .run();

  await db.prepare("UPDATE deuda SET saldo = ? WHERE id = ?").bind(saldoFinal, deudaId).run();

  // Cuando queda en cero, la venta pasa a pagada.
  if (saldoFinal === 0 && deuda.venta_id) {
    await db.prepare("UPDATE venta SET pagada = 1 WHERE id = ?").bind(deuda.venta_id).run();
  }

  revalidatePath("/panel/deudas");
  revalidatePath("/panel");
}
