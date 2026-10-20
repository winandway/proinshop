"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { formatearPrecio } from "@/lib/i18n";
import {
  enviarCola,
  quitarDeCola,
  reintentarRechazadas,
  suscribirCola,
  type VentaEnCola,
} from "@/componentes/panel/cola-ventas";

/**
 * La franja de la conexión en el panel:
 * - sin señal: avisa que se puede seguir vendiendo;
 * - con ventas guardadas sin señal: las manda solas al volver el internet;
 * - si el servidor rechaza una, dice por qué y deja reintentar o descartar.
 *
 * Además, con señal, deja guardadas por adelantado las páginas que se usan
 * sin internet (vender, inventario), para que abran aunque no se hayan
 * visitado ese día.
 */

const sinSuscripcion = () => () => {};

function suscribirRed(aviso: () => void) {
  window.addEventListener("online", aviso);
  window.addEventListener("offline", aviso);
  return () => {
    window.removeEventListener("online", aviso);
    window.removeEventListener("offline", aviso);
  };
}

const PRECARGADAS = "proinshop:precargadas";

export function EstadoConexion({ dueno, precargar }: { dueno: string; precargar: string[] }) {
  const router = useRouter();
  const enLinea = useSyncExternalStore(suscribirRed, () => navigator.onLine, () => true);
  const cruda = useSyncExternalStore(
    suscribirCola,
    () => window.localStorage.getItem(`proinshop:cola-ventas:${dueno}`) ?? "",
    () => "",
  );
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const cola = useMemo<VentaEnCola[]>(() => {
    try {
      return cruda ? JSON.parse(cruda) : [];
    } catch {
      return [];
    }
  }, [cruda]);
  const [enviadas, setEnviadas] = useState(0);
  const [mandando, setMandando] = useState(false);

  const pendientes = cola.filter((venta) => !venta.error);
  const rechazadas = cola.filter((venta) => venta.error);

  // Volvió la señal (o se abrió el panel) con ventas guardadas: se mandan.
  useEffect(() => {
    if (!enLinea || pendientes.length === 0) return;
    // Solo se cancela la espera. Un envío que ya arrancó termina y avisa,
    // aunque la lista cambie mientras tanto (cambia justo porque se envió).
    const espera = window.setTimeout(() => {
      setMandando(true);
      enviarCola(dueno)
        .then((resultado) => {
          if (resultado.enviadas > 0) {
            setEnviadas((previas) => previas + resultado.enviadas);
            router.refresh();
          }
        })
        .finally(() => setMandando(false));
    }, 800);
    return () => window.clearTimeout(espera);
  }, [enLinea, pendientes.length, dueno, router]);

  // Una vez por sesión del navegador, con señal y con el modo sin señal
  // activo: se guardan las páginas que se necesitan sin internet.
  useEffect(() => {
    if (!enLinea || precargar.length === 0) return;
    const espera = window.setTimeout(async () => {
      try {
        if (!navigator.serviceWorker?.controller) return;
        const marca = `${dueno}:${precargar.join(",")}`;
        if (window.sessionStorage.getItem(PRECARGADAS) === marca) return;
        for (const ruta of precargar) {
          await fetch(ruta, {
            credentials: "same-origin",
            headers: { Accept: "text/html", "X-Proinshop-Precarga": "1" },
          });
        }
        window.sessionStorage.setItem(PRECARGADAS, marca);
      } catch {
        // Sin señal a mitad: se intenta en la próxima visita.
      }
    }, 4000);
    return () => window.clearTimeout(espera);
  }, [enLinea, precargar, dueno]);

  if (!listo) return null;

  return (
    <div className="print:hidden">
      {!enLinea && (
        <p
          role="status"
          className="bg-ambar/15 px-4 py-2 text-center text-[12px] font-bold text-tinta"
        >
          📶 Sin señal. Puedes seguir vendiendo: las ventas se guardan en este dispositivo y se
          envían solas cuando vuelva el internet.
        </p>
      )}

      {pendientes.length > 0 && (
        <p role="status" className="bg-white px-4 py-2 text-center text-[12px] font-bold text-gris shadow-sm">
          {enLinea && mandando
            ? `Enviando ${pendientes.length} venta${pendientes.length === 1 ? "" : "s"} hecha${pendientes.length === 1 ? "" : "s"} sin señal…`
            : `${pendientes.length} venta${pendientes.length === 1 ? "" : "s"} guardada${pendientes.length === 1 ? "" : "s"} sin señal (${formatearPrecio(
                pendientes.reduce((suma, venta) => suma + venta.total, 0),
              )}). Se envían solas al volver el internet.`}
        </p>
      )}

      {enviadas > 0 && pendientes.length === 0 && (
        <p role="status" className="bg-white px-4 py-2 text-center text-[12px] font-bold text-verde shadow-sm">
          ✓ Se {enviadas === 1 ? "envió 1 venta hecha" : `enviaron ${enviadas} ventas hechas`} sin señal.
          Ya están en el balance.
        </p>
      )}

      {rechazadas.length > 0 && (
        <div className="border-y border-rojo/30 bg-rojo-suave px-4 py-2.5">
          <div className="mx-auto max-w-5xl">
            <p className="text-[12.5px] font-extrabold text-rojo-oscuro">
              {rechazadas.length === 1
                ? "Una venta hecha sin señal no se pudo guardar"
                : `${rechazadas.length} ventas hechas sin señal no se pudieron guardar`}
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {rechazadas.map((venta) => (
                <li key={venta.clave} className="flex items-start gap-2 text-[12px]">
                  <span className="min-w-0 flex-1 text-tinta">
                    <b>{formatearPrecio(venta.total)}</b> · {venta.unidades} unidad
                    {venta.unidades === 1 ? "" : "es"} · {new Date(venta.fecha).toLocaleString()}
                    <span className="block text-rojo-oscuro">{venta.error}</span>
                  </span>
                  <details className="relative shrink-0">
                    <summary
                      aria-label="Más opciones"
                      className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-lg bg-white text-base font-black text-gris"
                    >
                      ⋮
                    </summary>
                    <div className="absolute right-0 top-9 z-50 w-60 rounded-2xl border border-linea bg-white p-3 shadow-lg">
                      <p className="text-[12.5px] font-extrabold">¿Descartar esta venta?</p>
                      <p className="mt-1 text-[11.5px] text-gris">
                        Si la mercancía sí salió, regístrala de nuevo en Vender antes de descartarla.
                      </p>
                      <button
                        type="button"
                        onClick={() => quitarDeCola(dueno, venta.clave)}
                        className="mt-2.5 w-full rounded-xl bg-rojo py-2 text-[12px] font-extrabold text-white"
                      >
                        Sí, descartar
                      </button>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => reintentarRechazadas(dueno)}
              className="mt-2 rounded-xl border-[1.5px] border-rojo/40 bg-white px-3.5 py-1.5 text-[12px] font-bold text-rojo-oscuro"
            >
              Volver a intentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
