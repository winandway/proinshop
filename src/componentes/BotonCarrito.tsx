"use client";

import Link from "next/link";
import { useCarrito } from "./carrito";

export function BotonCarrito() {
  const { unidades, listo } = useCarrito();

  return (
    <Link
      href="/carrito"
      aria-label="Carrito"
      className="relative grid h-9 w-9 place-items-center rounded-xl bg-crema transition hover:bg-linea"
    >
      <span aria-hidden="true" className="text-base">
        🛒
      </span>
      {listo && unidades > 0 && (
        <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rojo px-1 text-[10px] font-black text-white">
          {unidades}
        </span>
      )}
    </Link>
  );
}
