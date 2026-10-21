"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * Instalar Proinshop en el celular, como una app: ícono en la pantalla de
 * inicio, pantalla completa, sin barra del navegador. Es lo mismo que bajar
 * la app de Treinta, sin pasar por la tienda de apps.
 *
 * Chrome avisa que se puede instalar una sola vez, apenas carga la página:
 * esa invitación se guarda aquí desde el principio (ServicioSinSenal llama a
 * escucharInstalacion) para usarla cuando la persona toque el botón.
 */

type InvitacionInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let invitacion: InvitacionInstalar | null = null;
let instaladaAhora = false;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((oyente) => oyente());

export function escucharInstalacion() {
  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    invitacion = evento as InvitacionInstalar;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    invitacion = null;
    instaladaAhora = true;
    avisar();
  });
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

type Situacion = "instalada" | "puede" | "iphone" | "manual";

function situacion(): Situacion {
  const enApp =
    instaladaAhora ||
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (enApp) return "instalada";
  if (invitacion) return "puede";
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return "iphone";
  return "manual";
}

export function InstalarApp({ compacto = false }: { compacto?: boolean }) {
  const estado = useSyncExternalStore(suscribir, situacion, () => "instalada" as Situacion);
  const [rechazada, setRechazada] = useState(false);

  // En la pantalla de inicio solo se ofrece a quien todavía no la instaló.
  if (compacto && estado === "instalada") return null;

  async function instalar() {
    if (!invitacion) return;
    await invitacion.prompt();
    const { outcome } = await invitacion.userChoice;
    if (outcome === "dismissed") setRechazada(true);
    invitacion = null;
    avisar();
  }

  const contenido =
    estado === "instalada" ? (
      <p className="text-[12.5px] font-bold text-verde">✓ Estás usando Proinshop instalado en este dispositivo.</p>
    ) : estado === "puede" ? (
      <button
        type="button"
        onClick={instalar}
        className="rounded-xl bg-rojo px-4 py-2.5 text-[12.5px] font-extrabold text-white transition hover:bg-rojo-oscuro"
      >
        📲 Instalar Proinshop en este celular
      </button>
    ) : estado === "iphone" ? (
      <p className="text-[12.5px] text-gris">
        En iPhone: toca <b>Compartir</b> (el cuadrado con la flecha hacia arriba) y luego{" "}
        <b>«Agregar a inicio»</b>. Queda el ícono de Proinshop junto a tus apps.
      </p>
    ) : (
      <p className="text-[12.5px] text-gris">
        En Chrome: toca el menú <b>⋮</b> y luego <b>«Instalar app»</b> o <b>«Agregar a la pantalla principal»</b>.
        Queda el ícono de Proinshop junto a tus apps.
      </p>
    );

  if (!compacto) {
    return (
      <>
        {contenido}
        {rechazada && (
          <p className="mt-2 text-[12px] text-gris">Cuando quieras, puedes instalarla desde aquí mismo.</p>
        )}
      </>
    );
  }

  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-linea bg-white p-4">
      <span aria-hidden="true" className="text-2xl">
        📲
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold">Proinshop en tu celular</p>
        <p className="mb-2 text-[12px] text-gris">Ábrelo con un toque, como cualquier app, y úsalo aunque se vaya la señal.</p>
        {contenido}
      </div>
    </div>
  );
}
