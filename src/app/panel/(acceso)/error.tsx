"use client";

import { PantallaError } from "@/componentes/PantallaError";

export default function ErrorAcceso({ error }: { error: Error & { digest?: string } }) {
  return <PantallaError error={error} inicio="/panel/entrar" />;
}
