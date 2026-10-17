"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { guardarZonaDelNavegador } from "@/lib/zona-navegador";

/** Le dice al servidor en qué hora vive el negocio. No pinta nada. */
export function ZonaHoraria() {
  const router = useRouter();
  useEffect(() => {
    // La primera vez, o si viajó: se recalculan los "hoy" con la hora buena.
    if (guardarZonaDelNavegador()) router.refresh();
  }, [router]);
  return null;
}
