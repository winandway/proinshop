"use client";

import { PantallaError } from "@/componentes/PantallaError";

export default function ErrorTienda({ error }: { error: Error & { digest?: string } }) {
  // La tienda es bilingüe: el idioma ya viene pintado en la página.
  const idioma =
    typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "es";
  return <PantallaError error={error} idioma={idioma} inicio="/" />;
}
