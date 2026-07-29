"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Barra de abajo, con la misma forma que la app que el dueño ya usa:
 * cinco destinos, fondo oscuro y el activo dentro de un círculo.
 */
const DESTINOS = [
  { href: "/panel", icono: "🏠", texto: "Inicio", exacto: true },
  { href: "/panel/balance", icono: "📊", texto: "Balance" },
  { href: "/panel/pedidos", icono: "🛒", texto: "Pedidos" },
  { href: "/panel/inventario", icono: "📦", texto: "Inventario" },
  { href: "/panel/explorar", icono: "⊞", texto: "Explorar" },
];

export function BarraInferior() {
  const ruta = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[74px] items-center justify-around bg-tinta px-1 pb-3 md:hidden">
      {DESTINOS.map((destino) => {
        const activo = destino.exacto ? ruta === destino.href : ruta.startsWith(destino.href);
        return (
          <Link
            key={destino.href}
            href={destino.href}
            aria-current={activo ? "page" : undefined}
            className={`flex-1 pt-2 text-center text-[9.5px] font-bold ${
              activo ? "text-white" : "text-[#868d97]"
            }`}
          >
            <span
              aria-hidden="true"
              className={`mx-auto mb-0.5 grid h-8 w-8 place-items-center rounded-full text-base ${
                activo ? "bg-rojo" : ""
              }`}
            >
              {destino.icono}
            </span>
            {destino.texto}
          </Link>
        );
      })}
    </nav>
  );
}

/** En pantalla grande la navegación va al costado, no abajo. */
export function MenuLateral() {
  const ruta = usePathname();

  return (
    <nav className="hidden w-56 shrink-0 border-r border-linea p-3 md:block">
      {DESTINOS.map((destino) => {
        const activo = destino.exacto ? ruta === destino.href : ruta.startsWith(destino.href);
        return (
          <Link
            key={destino.href}
            href={destino.href}
            aria-current={activo ? "page" : undefined}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13.5px] font-bold transition ${
              activo ? "bg-rojo-suave text-rojo-oscuro" : "text-gris hover:bg-crema"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              {destino.icono}
            </span>
            {destino.texto}
          </Link>
        );
      })}
    </nav>
  );
}
