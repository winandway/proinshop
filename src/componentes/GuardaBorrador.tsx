"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * Ningún formulario pierde lo escrito.
 *
 * Se pone dentro de cualquier <form> y, sin tocar nada más del formulario:
 * guarda lo que la persona escribe (con medio segundo de respiro) en su
 * navegador, se lo devuelve si cierra la ventana, se le va el internet o
 * recarga, y avisa con una línea discreta que se puede descartar.
 *
 * Lo sensible no se guarda nunca: contraseñas, códigos, archivos ni campos de
 * solo lectura. Cada borrador es de su dueño y de su formulario.
 *
 * Se borra al guardar bien: cuando React limpia el formulario después de un
 * envío exitoso (evento reset), cuando `limpiarCon` cambia, o con
 * `LimpiarBorrador` en la pantalla a la que se llega después de guardar.
 */

const PREFIJO = "proinshop:borrador:";
// Por nombre exacto: "codigo_barras" sí se guarda, el "codigo" de una
// invitación o de una recuperación no.
const CAMPOS_SENSIBLES =
  /^(contrasena|repetida|actual|nueva|clave|password|codigo|pin|cvv|tarjeta|numero_tarjeta)$/i;
const ESPERA_MS = 500;

/** El dueño del borrador: el id de la cuenta en el panel, "publico" en la tienda. */
const ContextoBorrador = createContext("publico");

function llave(dueno: string, clave: string) {
  return `${PREFIJO}${dueno}:${clave}`;
}

function leer(nombre: string): Record<string, string | boolean> | null {
  try {
    const crudo = window.localStorage.getItem(nombre);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function escribir(nombre: string, valor: Record<string, string | boolean>) {
  try {
    window.localStorage.setItem(nombre, JSON.stringify(valor));
  } catch {
    // Navegador privado o sin espacio: el formulario sigue funcionando igual.
  }
}

function borrar(nombre: string) {
  try {
    window.localStorage.removeItem(nombre);
  } catch {
    // Igual que arriba.
  }
}

/** Borra todos los borradores que empiezan por ese prefijo. */
function borrarPrefijo(prefijo: string) {
  try {
    const llaves: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const nombre = window.localStorage.key(i);
      if (nombre?.startsWith(prefijo)) llaves.push(nombre);
    }
    llaves.forEach((nombre) => window.localStorage.removeItem(nombre));
  } catch {
    // Igual que arriba.
  }
}

type Campo = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function camposGuardables(formulario: HTMLFormElement): Campo[] {
  return Array.from(formulario.elements).filter((elemento): elemento is Campo => {
    if (
      !(elemento instanceof HTMLInputElement) &&
      !(elemento instanceof HTMLTextAreaElement) &&
      !(elemento instanceof HTMLSelectElement)
    ) {
      return false;
    }
    if (!elemento.name || CAMPOS_SENSIBLES.test(elemento.name)) return false;
    if (elemento instanceof HTMLInputElement) {
      if (["password", "file", "hidden", "submit", "button", "reset", "image"].includes(elemento.type)) {
        return false;
      }
      if (elemento.readOnly) return false;
    }
    if (elemento instanceof HTMLTextAreaElement && elemento.readOnly) return false;
    return true;
  });
}

function tomarFoto(formulario: HTMLFormElement): Record<string, string | boolean> {
  const foto: Record<string, string | boolean> = {};
  for (const campo of camposGuardables(formulario)) {
    if (campo instanceof HTMLInputElement && campo.type === "checkbox") {
      foto[campo.name] = campo.checked;
    } else if (campo instanceof HTMLInputElement && campo.type === "radio") {
      if (campo.checked) foto[campo.name] = campo.value;
    } else {
      foto[campo.name] = campo.value;
    }
  }
  return foto;
}

/** Pone un valor como si lo hubiera escrito la persona, para que React se entere. */
function ponerValor(campo: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, valor: string) {
  const prototipo = Object.getPrototypeOf(campo) as object;
  const asignar = Object.getOwnPropertyDescriptor(prototipo, "value")?.set;
  if (asignar) asignar.call(campo, valor);
  else campo.value = valor;
  campo.dispatchEvent(new Event("input", { bubbles: true }));
  campo.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Devuelve lo guardado a su sitio. Dice si cambió algo. */
function devolver(formulario: HTMLFormElement, guardado: Record<string, string | boolean>): boolean {
  let cambio = false;
  for (const campo of camposGuardables(formulario)) {
    if (!(campo.name in guardado)) continue;
    const valor = guardado[campo.name];

    if (campo instanceof HTMLInputElement && campo.type === "checkbox") {
      if (campo.checked !== valor) {
        campo.click();
        cambio = true;
      }
    } else if (campo instanceof HTMLInputElement && campo.type === "radio") {
      if (campo.value === valor && !campo.checked) {
        campo.click();
        cambio = true;
      }
    } else if (typeof valor === "string" && campo.value !== valor) {
      ponerValor(campo, valor);
      cambio = true;
    }
  }
  return cambio;
}

export function ProveedorBorrador({
  dueno,
  children,
}: {
  dueno: string;
  children: React.ReactNode;
}) {
  // Quien llegó al panel ya entró: lo que escribió en las pantallas de acceso
  // no hace falta más.
  useEffect(() => {
    borrarPrefijo(`${PREFIJO}publico:acceso-`);
  }, []);

  return <ContextoBorrador.Provider value={dueno}>{children}</ContextoBorrador.Provider>;
}

/** Al cerrar sesión no queda nada de esa cuenta en la computadora. */
export function borrarBorradoresDe(dueno: string) {
  borrarPrefijo(`${PREFIJO}${dueno}:`);
}

export function GuardaBorrador({ clave, limpiarCon }: { clave: string; limpiarCon?: unknown }) {
  const dueno = useContext(ContextoBorrador);
  const ancla = useRef<HTMLSpanElement>(null);
  // null: no hay nada recuperado; "es" o "en": el idioma del aviso.
  const [recuperado, setRecuperado] = useState<"es" | "en" | null>(null);
  const limpiarInicial = useRef(limpiarCon);
  const nombre = llave(dueno, clave);

  useEffect(() => {
    const formulario = ancla.current?.closest("form");
    if (!formulario) return;

    const guardado = leer(nombre);
    // Se devuelve después de que React terminó de pintar el formulario.
    const devolucion = window.setTimeout(() => {
      if (guardado && devolver(formulario, guardado)) {
        // El panel es en español; la tienda habla el idioma que eligió el cliente.
        const ingles = dueno === "publico" && document.documentElement.lang === "en";
        setRecuperado(ingles ? "en" : "es");
      }
    }, 0);

    let pendiente: number | undefined;
    const alEscribir = () => {
      window.clearTimeout(pendiente);
      pendiente = window.setTimeout(() => escribir(nombre, tomarFoto(formulario)), ESPERA_MS);
    };
    const alLimpiar = () => {
      window.clearTimeout(pendiente);
      borrar(nombre);
      setRecuperado(null);
    };
    // Si cierra la pestaña antes del medio segundo, se guarda igual.
    const alSalir = () => {
      if (pendiente !== undefined) escribir(nombre, tomarFoto(formulario));
    };

    formulario.addEventListener("input", alEscribir);
    formulario.addEventListener("change", alEscribir);
    formulario.addEventListener("reset", alLimpiar);
    window.addEventListener("pagehide", alSalir);

    return () => {
      window.clearTimeout(devolucion);
      window.clearTimeout(pendiente);
      formulario.removeEventListener("input", alEscribir);
      formulario.removeEventListener("change", alEscribir);
      formulario.removeEventListener("reset", alLimpiar);
      window.removeEventListener("pagehide", alSalir);
    };
  }, [nombre, dueno]);

  // El formulario avisa que guardó bien: el borrador ya no hace falta.
  useEffect(() => {
    if (limpiarCon === undefined || limpiarCon === limpiarInicial.current) return;
    borrar(nombre);
    const ocultar = window.setTimeout(() => setRecuperado(null), 0);
    return () => window.clearTimeout(ocultar);
  }, [limpiarCon, nombre]);

  return (
    <span ref={ancla} className="contents">
      {recuperado && (
        <span
          role="status"
          className="mb-3 flex items-center gap-2 rounded-xl bg-crema px-3.5 py-2.5 text-[12px] text-gris"
        >
          <span className="flex-1">
            {recuperado === "en"
              ? "We restored what you were typing."
              : "Recuperamos lo que estabas escribiendo."}
          </span>
          <button
            type="button"
            onClick={() => {
              borrar(nombre);
              ancla.current?.closest("form")?.reset();
              setRecuperado(null);
            }}
            className="shrink-0 font-bold text-rojo hover:underline"
          >
            {recuperado === "en" ? "Start over" : "Empezar de nuevo"}
          </button>
        </span>
      )}
    </span>
  );
}

/** Se pone en la pantalla a la que se llega después de guardar bien. */
export function LimpiarBorrador({ claves }: { claves: string[] }) {
  const dueno = useContext(ContextoBorrador);
  const lista = claves.join("|");
  useEffect(() => {
    lista.split("|").forEach((clave) => borrar(llave(dueno, clave)));
  }, [dueno, lista]);
  return null;
}

/** Para formularios que manejan el envío a mano (por ejemplo, la tienda). */
export function borrarBorrador(clave: string, dueno = "publico") {
  borrar(llave(dueno, clave));
}

/**
 * Para pantallas cuyo contenido vive en el estado y no en campos (el carrito
 * de Vender): mismas llaves, mismo dueño, mismo borrado.
 */
export function useDuenoBorrador() {
  return useContext(ContextoBorrador);
}

export function leerBorradorDe<T>(clave: string, dueno: string): T | null {
  try {
    const crudo = window.localStorage.getItem(llave(dueno, clave));
    return crudo ? (JSON.parse(crudo) as T) : null;
  } catch {
    return null;
  }
}

export function guardarBorradorDe(clave: string, dueno: string, valor: unknown) {
  try {
    window.localStorage.setItem(llave(dueno, clave), JSON.stringify(valor));
  } catch {
    // Navegador privado o sin espacio: la venta sigue funcionando igual.
  }
}

export function borrarBorradorDe(clave: string, dueno: string) {
  borrar(llave(dueno, clave));
}
