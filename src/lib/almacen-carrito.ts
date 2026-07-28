/**
 * Carrito guardado en el navegador.
 *
 * Vive fuera de React y se expone con `useSyncExternalStore`: así no hace
 * falta escribir estado dentro de un efecto y no hay diferencia entre lo que
 * pinta el servidor (carrito vacío) y lo que ve el visitante al hidratar.
 */

import type { LineaCarrito } from "./tipos";

const CLAVE = "proinshop_carrito";

export type EstadoAlmacen = {
  lineas: LineaCarrito[];
  /** Falso hasta que se leyó el navegador: evita mostrar "vacío" antes de tiempo. */
  listo: boolean;
};

const ESTADO_SERVIDOR: EstadoAlmacen = { lineas: [], listo: false };

let estado: EstadoAlmacen = ESTADO_SERVIDOR;
let cargado = false;
const oyentes = new Set<() => void>();

function leerDelNavegador(): LineaCarrito[] {
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    return guardado ? (JSON.parse(guardado) as LineaCarrito[]) : [];
  } catch {
    // Si el almacenamiento está bloqueado, el carrito arranca vacío.
    return [];
  }
}

function escribirEnNavegador(lineas: LineaCarrito[]): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(lineas));
  } catch {
    // Sin almacenamiento el carrito vive solo durante la visita.
  }
}

function avisar(): void {
  for (const oyente of oyentes) oyente();
}

export function suscribir(oyente: () => void): () => void {
  if (!cargado) {
    cargado = true;
    estado = { lineas: leerDelNavegador(), listo: true };
  }
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export function instantanea(): EstadoAlmacen {
  return estado;
}

export function instantaneaServidor(): EstadoAlmacen {
  return ESTADO_SERVIDOR;
}

function reemplazar(lineas: LineaCarrito[]): void {
  estado = { lineas, listo: true };
  escribirEnNavegador(lineas);
  avisar();
}

function esLaMisma(linea: LineaCarrito, productoSlug: string, varianteId: number | null): boolean {
  return linea.productoSlug === productoSlug && linea.varianteId === varianteId;
}

export function agregar(nueva: LineaCarrito): void {
  const actuales = estado.lineas;
  const indice = actuales.findIndex((l) => esLaMisma(l, nueva.productoSlug, nueva.varianteId));
  if (indice === -1) {
    reemplazar([...actuales, nueva]);
    return;
  }
  const copia = [...actuales];
  copia[indice] = { ...copia[indice], cantidad: copia[indice].cantidad + nueva.cantidad };
  reemplazar(copia);
}

export function cambiarCantidad(
  productoSlug: string,
  varianteId: number | null,
  cantidad: number,
): void {
  reemplazar(
    cantidad <= 0
      ? estado.lineas.filter((l) => !esLaMisma(l, productoSlug, varianteId))
      : estado.lineas.map((l) => (esLaMisma(l, productoSlug, varianteId) ? { ...l, cantidad } : l)),
  );
}

export function quitar(productoSlug: string, varianteId: number | null): void {
  reemplazar(estado.lineas.filter((l) => !esLaMisma(l, productoSlug, varianteId)));
}

export function vaciar(): void {
  reemplazar([]);
}
