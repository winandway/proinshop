/**
 * Reglas de las llaves de acceso (entrar con huella o cara) que no dependen
 * de la base ni del navegador, para poder probarlas solas.
 */

/** Dominios donde se puede crear y usar una llave. */
const DOMINIOS: Record<string, string> = {
  "proinshop.com": "proinshop.com",
  "www.proinshop.com": "proinshop.com",
  "proinshop.sitios.dev": "proinshop.sitios.dev",
  localhost: "localhost",
};

export type SitioDeLlave = { rpID: string; origen: string };

/**
 * El navegador ata cada llave a un dominio: una llave hecha en proinshop.com
 * no sirve en ningún otro sitio. Por eso el dominio sale de una lista cerrada
 * y no de lo que diga la petición: si alguien monta una copia en otro
 * dominio, ahí las llaves no funcionan.
 */
export function sitioDeLlave(origen: string | null | undefined): SitioDeLlave | null {
  if (!origen) return null;
  let direccion: URL;
  try {
    direccion = new URL(origen);
  } catch {
    return null;
  }
  const rpID = DOMINIOS[direccion.hostname];
  if (!rpID) return null;
  // Fuera de la computadora de pruebas, solo con candado (https).
  if (rpID !== "localhost" && direccion.protocol !== "https:") return null;
  return { rpID, origen: direccion.origin };
}

/** Un nombre que la persona reconozca en la lista: «iPhone», «Mac»… */
export function nombreDelDispositivo(agente: string | null | undefined): string {
  const texto = agente ?? "";
  if (/iPhone/i.test(texto)) return "iPhone";
  if (/iPad/i.test(texto)) return "iPad";
  if (/Android/i.test(texto)) return "Celular Android";
  if (/Macintosh|Mac OS X/i.test(texto)) return "Mac";
  if (/Windows/i.test(texto)) return "Computadora Windows";
  if (/Linux/i.test(texto)) return "Computadora Linux";
  return "Este dispositivo";
}
