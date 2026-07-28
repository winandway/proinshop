import { cookies } from "next/headers";
import { COOKIE_IDIOMA, IDIOMA_POR_DEFECTO, esIdiomaValido } from "./i18n";
import type { Idioma } from "./tipos";

/** Idioma elegido por el visitante. Se guarda en cookie para que el
 *  servidor pueda renderizar directo en ese idioma, sin parpadeo. */
export async function idiomaActual(): Promise<Idioma> {
  const almacen = await cookies();
  const valor = almacen.get(COOKIE_IDIOMA)?.value;
  return esIdiomaValido(valor) ? valor : IDIOMA_POR_DEFECTO;
}
