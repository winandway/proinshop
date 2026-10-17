"use client";

import { useEffect } from "react";

/**
 * Lo que se ve cuando algo falla, en vez de la pantalla técnica en blanco.
 *
 * El botón recarga la página completa y no solo el pedazo que falló: si el
 * error vino de que se publicó una versión nueva mientras la página estaba
 * abierta, solo una recarga completa lo arregla.
 */
export function PantallaError({
  error,
  idioma = "es",
  inicio = "/",
}: {
  error: Error & { digest?: string };
  idioma?: "es" | "en";
  inicio?: string;
}) {
  useEffect(() => {
    // Queda en la consola del navegador y, con el código, en el registro del
    // servidor: un fallo nunca pasa en silencio.
    console.error("Proinshop:", error.digest ?? "", error);
  }, [error]);

  const textos =
    idioma === "en"
      ? {
          titulo: "Something didn't work",
          detalle: "Reload the page to continue. If it happens again, contact us.",
          recargar: "Reload the page",
          volver: "Go to the start",
        }
      : {
          titulo: "Algo no salió bien",
          detalle: "Recarga la página para seguir. Si vuelve a pasar, escríbenos.",
          recargar: "Recargar la página",
          volver: "Ir al inicio",
        };

  return (
    <div role="alert" className="mx-auto max-w-md px-4 py-16 text-center">
      <p aria-hidden="true" className="text-4xl">
        ⚠️
      </p>
      <h1 className="mt-3 text-xl font-black tracking-tight">{textos.titulo}</h1>
      <p className="mt-2 text-[13.5px] text-gris">{textos.detalle}</p>
      {error.digest && <p className="mt-1 text-[11px] text-gris2">Código: {error.digest}</p>}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 w-full rounded-2xl bg-rojo py-4 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
      >
        {textos.recargar}
      </button>
      <a
        href={inicio}
        className="mt-2.5 block w-full rounded-2xl border-[1.5px] border-linea py-3.5 text-sm font-bold text-gris transition hover:border-gris2"
      >
        {textos.volver}
      </a>
    </div>
  );
}
