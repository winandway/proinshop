"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Vuelve a pedir la pantalla cada tanto, para que lo nuevo aparezca solo. */
export function RefrescoAutomatico({ segundos = 30 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const reloj = window.setInterval(() => router.refresh(), segundos * 1000);
    return () => window.clearInterval(reloj);
  }, [router, segundos]);
  return null;
}
