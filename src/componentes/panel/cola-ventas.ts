"use client";

/**
 * Ventas hechas sin señal.
 *
 * Si no hay internet al cobrar, la venta se guarda aquí, en el navegador, y
 * se manda sola cuando vuelve la señal. Cada venta lleva su llave única: si
 * se manda dos veces (se cortó a mitad de camino), el servidor guarda una.
 *
 * Al cerrar sesión NO se borran: son ventas que ocurrieron de verdad. Cada
 * cola lleva la cuenta, así en una computadora compartida nadie manda las
 * ventas de otro.
 */

export type VentaEnCola = {
  clave: string;
  /** Cuándo se vendió, en hora universal. */
  fecha: string;
  lineas: string;
  pagos: string;
  cliente_id: string;
  descuento: string;
  nota: string;
  /** Para mostrar en la franja. */
  total: number;
  unidades: number;
  /** Lo que respondió el servidor si no la pudo guardar. */
  error?: string;
};

const EVENTO = "proinshop-cola-ventas";
const llave = (dueno: string) => `proinshop:cola-ventas:${dueno}`;

export function leerCola(dueno: string): VentaEnCola[] {
  try {
    const crudo = window.localStorage.getItem(llave(dueno));
    const lista = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function escribirCola(dueno: string, lista: VentaEnCola[]) {
  try {
    if (lista.length === 0) window.localStorage.removeItem(llave(dueno));
    else window.localStorage.setItem(llave(dueno), JSON.stringify(lista));
  } catch {
    // Sin espacio o navegador privado: no hay dónde guardar.
    throw new Error("Este navegador no deja guardar la venta sin señal.");
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function agregarACola(dueno: string, venta: VentaEnCola) {
  const lista = leerCola(dueno).filter((v) => v.clave !== venta.clave);
  escribirCola(dueno, [...lista, venta]);
}

export function quitarDeCola(dueno: string, clave: string) {
  escribirCola(
    dueno,
    leerCola(dueno).filter((v) => v.clave !== clave),
  );
}

function anotarError(dueno: string, clave: string, error: string) {
  escribirCola(
    dueno,
    leerCola(dueno).map((v) => (v.clave === clave ? { ...v, error } : v)),
  );
}

/** Para useSyncExternalStore: avisa cuando cambia la cola, aquí o en otra pestaña. */
export function suscribirCola(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

/** Una llave nueva por venta. */
export function nuevaClave(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

let enviando = false;

/**
 * Manda la cola en orden. Si se cae la señal a mitad, para y lo deja para la
 * próxima. Si el servidor rechaza una (por ejemplo, el producto se borró),
 * queda marcada con el motivo y se sigue con las demás.
 */
export async function enviarCola(dueno: string): Promise<{ enviadas: number; rechazadas: number }> {
  if (enviando) return { enviadas: 0, rechazadas: 0 };
  enviando = true;
  let enviadas = 0;
  let rechazadas = 0;
  try {
    for (const venta of leerCola(dueno)) {
      if (venta.error) continue;
      let respuesta: Response;
      try {
        respuesta = await fetch("/panel/cola-ventas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(venta),
        });
      } catch {
        break; // Sin señal otra vez: se reintenta cuando vuelva.
      }
      if (respuesta.ok) {
        quitarDeCola(dueno, venta.clave);
        enviadas += 1;
        continue;
      }
      if (respuesta.status === 401 || respuesta.status >= 500) break;
      const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string };
      anotarError(dueno, venta.clave, cuerpo.error ?? "El servidor no la aceptó");
      rechazadas += 1;
    }
  } finally {
    enviando = false;
  }
  return { enviadas, rechazadas };
}

/** Vuelve a intentar las que el servidor rechazó (después de corregir lo que faltaba). */
export function reintentarRechazadas(dueno: string) {
  escribirCola(
    dueno,
    leerCola(dueno).map((venta) => ({ ...venta, error: undefined })),
  );
}
