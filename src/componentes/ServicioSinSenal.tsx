"use client";

import { useEffect } from "react";
import { escucharInstalacion } from "@/componentes/InstalarApp";

/**
 * Pone a trabajar el archivo que guarda copias de las páginas (public/sw.js)
 * para que la tienda y el panel abran sin señal.
 *
 * La versión va en la dirección: cada publicación instala uno nuevo y borra
 * las copias de la anterior.
 */
const VERSION = process.env.NEXT_PUBLIC_VERSION ?? "local";

export function ServicioSinSenal() {
  useEffect(() => {
    escucharInstalacion();
    if (!("serviceWorker" in navigator)) return;
    // Mientras se programa, las copias esconderían los cambios.
    if (process.env.NODE_ENV === "development") return;
    navigator.serviceWorker
      .register(`/sw.js?v=${VERSION}`, { scope: "/" })
      .catch((error) => console.error("Proinshop: no se pudo activar el modo sin señal", error));
  }, []);
  return null;
}

/** Borra las copias de páginas guardadas: al salir y al llegar a la entrada. */
export async function borrarCopiasDePaginas() {
  try {
    if (!("caches" in window)) return;
    const nombres = await caches.keys();
    await Promise.all(
      nombres.filter((nombre) => nombre.startsWith("proinshop-paginas")).map((nombre) => caches.delete(nombre)),
    );
  } catch (error) {
    console.error("Proinshop: no se pudieron borrar las copias del panel", error);
  }
}

/** En las pantallas de entrar: nadie que no haya entrado ve copias del panel. */
export function LimpiarCopias() {
  useEffect(() => {
    void borrarCopiasDePaginas();
  }, []);
  return null;
}
