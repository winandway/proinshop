"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Paso } from "@/lib/primeros-pasos";

/**
 * La tarjeta de primeros pasos en el inicio. Es una tarjeta más del panel,
 * nunca una ventana que tape: se puede ocultar y desaparece sola cuando todo
 * está hecho.
 */

const LLAVE = "proinshop:primeros-pasos:oculto";
const sinSuscripcion = () => () => {};

function leerOculto() {
  try {
    return window.localStorage.getItem(LLAVE) === "1";
  } catch {
    return false;
  }
}

export function PrimerosPasos({ pasos, avance }: { pasos: Paso[]; avance: number }) {
  const ocultoGuardado = useSyncExternalStore(sinSuscripcion, leerOculto, () => false);
  const [oculto, setOculto] = useState(false);
  if (avance === 100 || oculto || ocultoGuardado) return null;

  const hechos = pasos.filter((paso) => paso.hecho).length;

  return (
    <section aria-label="Primeros pasos" className="mb-4 rounded-2xl border border-linea bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[13.5px] font-extrabold">Primeros pasos</h2>
          <p className="text-[12px] text-gris">
            {hechos} de {pasos.length} listos. Así dejas tu negocio andando en Proinshop.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.setItem(LLAVE, "1");
            } catch {
              // Sin almacenamiento: se oculta solo por esta vez.
            }
            setOculto(true);
          }}
          className="shrink-0 text-[12px] font-bold text-gris hover:text-tinta"
        >
          Ocultar
        </button>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-crema" aria-hidden="true">
        <div className="h-full rounded-full bg-verde transition-all" style={{ width: `${avance}%` }} />
      </div>
      <ul className="mt-3 space-y-1.5">
        {pasos.map((paso) => (
          <li key={paso.clave}>
            <Link
              href={paso.enlace}
              className="flex items-center gap-2.5 rounded-xl px-1 py-1 text-[12.5px] transition hover:bg-crema"
            >
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                  paso.hecho ? "bg-verde text-white" : "border-[1.5px] border-gris2 text-transparent"
                }`}
              >
                ✓
              </span>
              <span className={paso.hecho ? "text-gris line-through" : "font-bold text-tinta"}>{paso.texto}</span>
              <span className="sr-only">{paso.hecho ? "(hecho)" : "(pendiente)"}</span>
              {!paso.hecho && (
                <span aria-hidden="true" className="ml-auto text-gris2">
                  ›
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/docs" className="mt-3 block text-[12px] font-bold text-rojo hover:underline">
        Ver las guías de cada herramienta en Docs →
      </Link>
    </section>
  );
}
