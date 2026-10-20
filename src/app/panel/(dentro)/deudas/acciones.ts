"use server";

import { revalidatePath } from "next/cache";
import { leerMonto } from "@/lib/numeros";
import { baseDeDatos } from "@/lib/d1";
import { usuarioQuePuede } from "@/lib/sesion";
import { anotarActividad } from "@/lib/actividad";
import { formatearPrecio } from "@/lib/i18n";

/** Registra un abono y baja el saldo de la deuda. */
export async function registrarAbono(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("clientes");
  if (!usuario) return;

  const db = await baseDeDatos();
  if (!db) return;

  const deudaId = Number(datos.get("deuda_id"));
  const monto = leerMonto(datos.get("monto"));
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

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "abono",
    detalle: `Registró un abono de ${formatearPrecio(aplicado)}${saldoFinal === 0 ? " y la deuda quedó saldada" : ""}`,
    monto: aplicado,
    enlace: "/panel/deudas",
  });

  revalidatePath("/panel/deudas");
  revalidatePath("/panel");
}
