/**
 * Contraseñas: PBKDF2-SHA256 con sal por usuario.
 *
 * Se usa WebCrypto porque es lo que hay en el runtime del worker — nada de
 * librerías externas, que engordarían el `_worker.js`. Las 210.000 vueltas
 * son la recomendación vigente de OWASP para PBKDF2-SHA256.
 */

const VUELTAS = 210_000;
const LARGO_CLAVE = 32;

function aHex(datos: ArrayBuffer): string {
  return [...new Uint8Array(datos)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function deHex(texto: string): ArrayBuffer {
  const bytes = new Uint8Array(new ArrayBuffer(texto.length / 2));
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(texto.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

export function nuevaSal(): string {
  return aHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

/** Valor aleatorio para identificadores de sesión y códigos de invitación. */
export function valorAleatorio(bytes = 32): string {
  return aHex(crypto.getRandomValues(new Uint8Array(bytes)).buffer);
}

export async function cifrarContrasena(contrasena: string, sal: string): Promise<string> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(contrasena),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivada = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: deHex(sal), iterations: VUELTAS, hash: "SHA-256" },
    material,
    LARGO_CLAVE * 8,
  );

  return aHex(derivada);
}

/**
 * Comparación en tiempo constante: comparar con `===` filtra información por
 * el tiempo que tarda en fallar.
 */
export async function verificarContrasena(
  contrasena: string,
  sal: string,
  hashGuardado: string,
): Promise<boolean> {
  const hash = await cifrarContrasena(contrasena, sal);
  if (hash.length !== hashGuardado.length) return false;

  let diferencia = 0;
  for (let i = 0; i < hash.length; i += 1) {
    diferencia |= hash.charCodeAt(i) ^ hashGuardado.charCodeAt(i);
  }
  return diferencia === 0;
}

/** Reglas mínimas de la contraseña, con el motivo en español. */
export function revisarContrasena(contrasena: string): string | null {
  if (contrasena.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[a-zA-Z]/.test(contrasena)) return "La contraseña debe incluir al menos una letra";
  if (!/[0-9]/.test(contrasena)) return "La contraseña debe incluir al menos un número";
  return null;
}

export function correoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim());
}
