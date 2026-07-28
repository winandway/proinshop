"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_IDIOMA, esIdiomaValido } from "@/lib/i18n";

/** Guarda el idioma elegido y vuelve a pintar el sitio en ese idioma. */
export async function cambiarIdioma(valor: string): Promise<void> {
  if (!esIdiomaValido(valor)) return;

  const almacen = await cookies();
  almacen.set(COOKIE_IDIOMA, valor, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
