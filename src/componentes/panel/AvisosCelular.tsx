"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  clavePublicaAviso,
  guardarSuscripcion,
  probarAviso,
  quitarSuscripcion,
} from "@/app/panel/avisos-celular";

/**
 * Activar los avisos en este celular o computadora. Llegan aunque el panel
 * esté cerrado: pedidos de la tienda y, para el dueño, lo que hace el equipo.
 */

type Estado = "cargando" | "no-soporta" | "iphone-sin-instalar" | "bloqueado" | "apagado" | "activo";

const sinSuscripcion = () => () => {};

function soporte(): "si" | "no" | "iphone-sin-instalar" {
  const esIphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const instalada =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (esIphone && !instalada) return "iphone-sin-instalar";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
    return "no";
  }
  return "si";
}

const aBytes = (texto: string) =>
  Uint8Array.from(atob(texto.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export function AvisosCelular() {
  const disponible = useSyncExternalStore(sinSuscripcion, soporte, () => "si" as const);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (disponible !== "si") return;
    let vigente = true;
    navigator.serviceWorker.ready
      .then((registro) => registro.pushManager.getSubscription())
      .then((suscripcion) => {
        if (!vigente) return;
        if (Notification.permission === "denied") setEstado("bloqueado");
        else setEstado(suscripcion ? "activo" : "apagado");
      })
      .catch(() => vigente && setEstado("apagado"));
    return () => {
      vigente = false;
    };
  }, [disponible]);

  async function activar() {
    setMensaje("");
    setOcupado(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "apagado");
        return;
      }
      const { publica, error } = await clavePublicaAviso();
      if (!publica) throw new Error(error);
      const registro = await navigator.serviceWorker.ready;
      let suscripcion = await registro.pushManager.getSubscription();
      // Una suscripción vieja, hecha con otra llave, ya no sirve: se renueva.
      if (suscripcion) await suscripcion.unsubscribe();
      suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: aBytes(publica),
      });
      const guardada = await guardarSuscripcion(suscripcion.toJSON());
      if (!guardada.ok) throw new Error(guardada.error);
      setEstado("activo");
      setMensaje("Listo. Toca «Mandarme un aviso de prueba» para comprobarlo.");
    } catch (fallo) {
      setMensaje(
        fallo instanceof Error && fallo.message
          ? `No se pudieron activar: ${fallo.message}`
          : "No se pudieron activar los avisos en este navegador.",
      );
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setOcupado(true);
    try {
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.getSubscription();
      if (suscripcion) {
        await quitarSuscripcion(suscripcion.endpoint);
        await suscripcion.unsubscribe();
      }
      setEstado("apagado");
      setMensaje("Este celular ya no recibe avisos.");
    } finally {
      setOcupado(false);
    }
  }

  async function probar() {
    setOcupado(true);
    setMensaje("");
    try {
      const resultado = await probarAviso();
      setMensaje(resultado.error ?? "Te mandamos un aviso de prueba: debe llegar en unos segundos.");
    } finally {
      setOcupado(false);
    }
  }

  if (disponible === "iphone-sin-instalar") {
    return (
      <p className="text-[12.5px] text-gris">
        En iPhone, los avisos llegan cuando Proinshop está instalado: toca Compartir y luego «Agregar a
        inicio», abre Proinshop desde ese ícono y vuelve aquí.
      </p>
    );
  }
  if (disponible === "no") {
    return <p className="text-[12.5px] text-gris">Este navegador no recibe avisos. Prueba con Chrome o Safari al día.</p>;
  }

  return (
    <>
      {estado === "cargando" && <p className="text-[12.5px] text-gris">Revisando este celular…</p>}
      {estado === "bloqueado" && (
        <p className="text-[12.5px] text-gris">
          Los avisos están bloqueados en este navegador. Permítelos en los ajustes del sitio y vuelve aquí.
        </p>
      )}
      {estado === "apagado" && (
        <button
          type="button"
          onClick={activar}
          disabled={ocupado}
          className="rounded-xl bg-tinta px-4 py-2.5 text-[12.5px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {ocupado ? "Activando…" : "🔔 Activar avisos en este celular"}
        </button>
      )}
      {estado === "activo" && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="w-full text-[12.5px] font-bold text-verde">✓ Este celular recibe avisos, aunque el panel esté cerrado.</p>
          <button
            type="button"
            onClick={probar}
            disabled={ocupado}
            className="rounded-xl bg-tinta px-4 py-2.5 text-[12.5px] font-extrabold text-white disabled:opacity-60"
          >
            Mandarme un aviso de prueba
          </button>
          <button
            type="button"
            onClick={desactivar}
            disabled={ocupado}
            className="rounded-xl border-[1.5px] border-linea px-4 py-2.5 text-[12.5px] font-bold text-gris disabled:opacity-60"
          >
            Desactivar
          </button>
        </div>
      )}
      {mensaje && (
        <p role="status" className="mt-2 text-[12px] font-bold text-gris">
          {mensaje}
        </p>
      )}
    </>
  );
}
