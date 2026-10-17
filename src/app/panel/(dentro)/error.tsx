"use client";

import { PantallaError } from "@/componentes/PantallaError";

export default function ErrorPanel({ error }: { error: Error & { digest?: string } }) {
  return <PantallaError error={error} inicio="/panel" />;
}
