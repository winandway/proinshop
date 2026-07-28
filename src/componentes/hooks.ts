"use client";

import { useSyncExternalStore } from "react";

const sinCambios = () => () => {};
const enNavegador = () => true;
const enServidor = () => false;

/**
 * Verdadero solo después de hidratar. Sirve para leer cosas que únicamente
 * existen en el navegador (localStorage) sin que el HTML del servidor y el
 * del cliente queden distintos.
 */
export function useEstaHidratado(): boolean {
  return useSyncExternalStore(sinCambios, enNavegador, enServidor);
}
