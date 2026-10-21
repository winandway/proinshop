"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Avisos en vivo, como las notificaciones de Treinta: cuando entra un pedido
 * de la tienda o alguien del equipo registra algo, aparece una franja debajo
 * del encabezado (nunca una ventana que tape) y, si la persona dio permiso,
 * una notificación del celular o la computadora.
 *
 * Pregunta cada 30 segundos mientras el panel está abierto. Recuerda lo último
 * que ya avisó para no repetirlo.
 */

type Respuesta = {
  pedido?: { id: number; numero: string; total: number; cliente_nombre: string; nuevos: number } | null;
  actividad?: { id: number; detalle: string; nombre: string | null } | null;
};

type Aviso = { clave: string; texto: string; enlace: string };

const LLAVE = "proinshop:avisos:visto";

function leerVisto(): { pedido: number; actividad: number } {
  try {
    return JSON.parse(window.localStorage.getItem(LLAVE) ?? "") as { pedido: number; actividad: number };
  } catch {
    return { pedido: 0, actividad: 0 };
  }
}

function guardarVisto(visto: { pedido: number; actividad: number }) {
  try {
    window.localStorage.setItem(LLAVE, JSON.stringify(visto));
  } catch {
    // Sin almacenamiento, solo se repite el aviso: no pasa nada grave.
  }
}

function notificar(titulo: string, cuerpo: string, etiqueta: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    // La misma etiqueta que el aviso al celular: si llegan los dos, se ve uno.
    new Notification(titulo, { body: cuerpo, icon: "/icon.png", tag: etiqueta });
  } catch {
    // Algunos celulares solo dejan notificar desde la app instalada.
  }
}

export function AvisosEnVivo() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const router = useRouter();

  useEffect(() => {
    let activo = true;
    let primera = true;

    async function revisar() {
      try {
        const respuesta = await fetch("/panel/avisos", { cache: "no-store" });
        if (!respuesta.ok) return;
        const datos = (await respuesta.json()) as Respuesta;
        if (!activo) return;
        const visto = leerVisto();
        const nuevos: Aviso[] = [];

        if (datos.pedido && datos.pedido.id > visto.pedido) {
          // La primera vez solo se toma nota: no se avisa de lo que ya había.
          if (!primera || visto.pedido > 0) {
            const texto = `Nuevo pedido #${datos.pedido.numero} de ${datos.pedido.cliente_nombre}`;
            nuevos.push({ clave: `p${datos.pedido.id}`, texto, enlace: `/panel/pedidos/${datos.pedido.id}` });
            notificar("🛒 Nuevo pedido", texto, `pedido-${datos.pedido.id}`);
          }
          visto.pedido = datos.pedido.id;
        }
        if (datos.actividad && datos.actividad.id > visto.actividad) {
          if (!primera || visto.actividad > 0) {
            const texto = `${datos.actividad.nombre ?? "Alguien"}: ${datos.actividad.detalle}`;
            nuevos.push({ clave: `a${datos.actividad.id}`, texto, enlace: "/panel/actividad" });
            notificar("Actividad del equipo", texto, `actividad-${datos.actividad.id}`);
          }
          visto.actividad = datos.actividad.id;
        }

        guardarVisto(visto);
        if (nuevos.length > 0) {
          setAvisos((actuales) => [...nuevos, ...actuales].slice(0, 3));
          router.refresh();
        }
      } catch {
        // Sin internet un momento: se vuelve a preguntar en el siguiente turno.
      } finally {
        primera = false;
      }
    }

    revisar();
    const reloj = window.setInterval(revisar, 30_000);
    return () => {
      activo = false;
      window.clearInterval(reloj);
    };
  }, [router]);

  if (avisos.length === 0) return null;

  return (
    <div role="status" className="border-b border-verde/30 bg-verde-suave print:hidden">
      {avisos.map((aviso) => (
        <div key={aviso.clave} className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
          <Link
            href={aviso.enlace}
            onClick={() => setAvisos((a) => a.filter((x) => x.clave !== aviso.clave))}
            className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-[#0b6e3a]"
          >
            {aviso.texto} →
          </Link>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setAvisos((a) => a.filter((x) => x.clave !== aviso.clave))}
            className="text-[#0b6e3a]"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
