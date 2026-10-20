"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  entrarConLlave,
  guardarLlave,
  opcionesParaEntrar,
  opcionesParaRegistrar,
} from "@/app/panel/llaves";

/**
 * Los dos botones de la huella: el de entrar (pantalla de acceso) y el de
 * activarla (Mi cuenta). Solo aparecen si el navegador la soporta, para no
 * ofrecer algo que luego no funciona.
 */

const sinSuscripcion = () => () => {};

function useSoportaHuella() {
  return useSyncExternalStore(sinSuscripcion, () => browserSupportsWebAuthn(), () => false);
}

/** Lo que dice el navegador cuando algo sale mal, en palabras de persona. */
function explicar(error: unknown, activando: boolean): string {
  const nombre = (error as { name?: string })?.name;
  if (nombre === "NotAllowedError" || nombre === "AbortError") {
    return "Se canceló o pasó el tiempo. Toca el botón otra vez.";
  }
  if (nombre === "InvalidStateError" && activando) {
    return "Este dispositivo ya tiene la huella activada para tu cuenta.";
  }
  if (nombre === "SecurityError") return "La huella solo funciona en la dirección oficial del panel.";
  return activando
    ? "Este dispositivo no pudo activar la huella. Puedes seguir entrando con tu contraseña."
    : "No se pudo usar la huella en este dispositivo. Entra con tu contraseña.";
}

function Huella() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 11c0 3.5-1 6.5-2.5 8.5" />
      <path d="M8.5 7.6A5 5 0 0 1 17 11c0 1.8-.2 3.6-.7 5.2" />
      <path d="M5.2 15.5A11 11 0 0 0 7 11a5 5 0 0 1 .4-2" />
      <path d="M14 21c.7-1.6 1.3-3.4 1.6-5.4" />
      <path d="M3.5 11a8.5 8.5 0 0 1 15.4-5" />
      <path d="M20.5 9.5c.3 1.6.3 3.3 0 5" />
      <path d="M12 15c-.3 1.7-.9 3.3-1.8 4.8" />
    </svg>
  );
}

export function EntrarConHuella() {
  const soporta = useSoportaHuella();
  const [estado, setEstado] = useState<"quieto" | "esperando">("quieto");
  const [error, setError] = useState("");

  if (!soporta) return null;

  async function entrar() {
    setError("");
    setEstado("esperando");
    try {
      const { opciones, error: sinOpciones } = await opcionesParaEntrar();
      if (!opciones) throw new Error(sinOpciones);
      let respuesta;
      try {
        respuesta = await startAuthentication({ optionsJSON: opciones });
      } catch (fallo) {
        setError(explicar(fallo, false));
        return;
      }
      const resultado = await entrarConLlave(respuesta);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo entrar con la huella.");
        return;
      }
      // Carga completa a propósito: el encabezado y los menús tienen que leer
      // la sesión nueva, y una navegación interna los dejaría como estaban.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/panel";
    } catch (fallo) {
      setError(fallo instanceof Error && fallo.message ? fallo.message : "No se pudo entrar con la huella.");
    } finally {
      setEstado("quieto");
    }
  }

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center gap-3 text-[11.5px] font-bold text-gris2">
        <span className="h-px flex-1 bg-linea" />o<span className="h-px flex-1 bg-linea" />
      </div>
      <button
        type="button"
        onClick={entrar}
        disabled={estado === "esperando"}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-tinta bg-white py-3 text-[13.5px] font-extrabold text-tinta transition hover:bg-crema disabled:opacity-60"
      >
        <Huella />
        {estado === "esperando" ? "Esperando tu huella…" : "Entrar con huella o cara"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-[12px] font-bold text-rojo-oscuro">
          {error}
        </p>
      )}
    </div>
  );
}

export function ActivarHuella() {
  const soporta = useSoportaHuella();
  const router = useRouter();
  const [estado, setEstado] = useState<"quieto" | "esperando" | "lista">("quieto");
  const [error, setError] = useState("");

  if (!soporta) {
    return (
      <p className="text-[12.5px] text-gris">
        Este navegador no permite entrar con huella o cara. Prueba desde tu celular o con Chrome o Safari al día.
      </p>
    );
  }

  async function activar() {
    setError("");
    setEstado("esperando");
    try {
      const { opciones, error: sinOpciones } = await opcionesParaRegistrar();
      if (!opciones) throw new Error(sinOpciones);
      let respuesta;
      try {
        respuesta = await startRegistration({ optionsJSON: opciones });
      } catch (fallo) {
        setError(explicar(fallo, true));
        setEstado("quieto");
        return;
      }
      const resultado = await guardarLlave(respuesta);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo activar la huella.");
        setEstado("quieto");
        return;
      }
      setEstado("lista");
      router.refresh();
    } catch (fallo) {
      setError(fallo instanceof Error && fallo.message ? fallo.message : "No se pudo activar la huella.");
      setEstado("quieto");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={activar}
        disabled={estado === "esperando"}
        className="flex items-center gap-2 rounded-xl bg-tinta px-4 py-2.5 text-[12.5px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        <Huella />
        {estado === "esperando" ? "Esperando tu huella…" : "Activar en este dispositivo"}
      </button>
      {estado === "lista" && (
        <p role="status" className="mt-2 text-[12px] font-bold text-verde">
          Listo. La próxima vez entra con tu huella o tu cara.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-[12px] font-bold text-rojo-oscuro">
          {error}
        </p>
      )}
    </>
  );
}
