"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { baseDeDatos } from "@/lib/d1";
import { anotarActividad } from "@/lib/actividad";
import { cajaAbierta, diferenciaCaja, efectivoEsperado, movimientosDesde } from "@/lib/caja";
import { leerMonto } from "@/lib/numeros";
import { formatearPrecio } from "@/lib/i18n";
import { usuarioQuePuede } from "@/lib/sesion";

export async function abrirCaja(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("caja");
  if (!usuario) return;
  const db = await baseDeDatos();
  if (!db) return;

  // Una sola caja abierta a la vez: si ya hay una, no se abre otra.
  if (await cajaAbierta(db)) redirect("/panel/caja");

  const inicial = Math.max(0, leerMonto(datos.get("monto_inicial")));
  await db
    .prepare("INSERT INTO caja (abierta_por, monto_inicial) VALUES (?, ?)")
    .bind(usuario.id, inicial)
    .run();

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "caja",
    detalle: `Abrió la caja con ${formatearPrecio(inicial)}`,
    monto: inicial,
    enlace: "/panel/caja",
  });

  revalidatePath("/panel/caja");
  revalidatePath("/panel");
  redirect("/panel/caja?abierta=1");
}

export async function cerrarCaja(datos: FormData): Promise<void> {
  const usuario = await usuarioQuePuede("caja");
  if (!usuario) return;
  const db = await baseDeDatos();
  if (!db) return;

  const caja = await cajaAbierta(db);
  if (!caja) redirect("/panel/caja");

  const movimientos = await movimientosDesde(db, caja.abierta_en, null);
  const esperado = efectivoEsperado(caja.monto_inicial, movimientos);
  const contado = Math.max(0, leerMonto(datos.get("efectivo_contado")));
  const diferencia = diferenciaCaja(contado, esperado);

  await db
    .prepare(
      `UPDATE caja SET cerrada_en = datetime('now'), cerrada_por = ?, efectivo_esperado = ?,
         efectivo_contado = ?, diferencia = ?, nota = ?
       WHERE id = ? AND cerrada_en IS NULL`,
    )
    .bind(
      usuario.id,
      esperado,
      contado,
      diferencia,
      String(datos.get("nota") ?? "").trim().slice(0, 300) || null,
      caja.id,
    )
    .run();

  await anotarActividad({
    usuarioId: usuario.id,
    tipo: "caja",
    detalle:
      diferencia === 0
        ? "Cerró la caja: cuadró exacto"
        : diferencia < 0
          ? `Cerró la caja: faltan ${formatearPrecio(-diferencia)}`
          : `Cerró la caja: sobran ${formatearPrecio(diferencia)}`,
    monto: diferencia,
    enlace: "/panel/caja",
  });

  revalidatePath("/panel/caja");
  revalidatePath("/panel");
  redirect(`/panel/caja?cerrada=${caja.id}`);
}
