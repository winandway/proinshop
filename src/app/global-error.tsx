"use client";

import "./globals.css";
import { PantallaError } from "@/componentes/PantallaError";

/** Último recurso: si falla hasta el marco de la página, igual se ve algo útil. */
export default function ErrorGeneral({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="es">
      <body className="bg-crema">
        <PantallaError error={error} />
      </body>
    </html>
  );
}
