/**
 * Guarda en una cookie la diferencia horaria de este navegador, para que el
 * servidor corte el día a medianoche del negocio y no de Londres.
 * Devuelve true si cambió (hay que volver a pedir la página).
 */
export function guardarZonaDelNavegador(): boolean {
  const minutos = -new Date().getTimezoneOffset();
  const actual = document.cookie.match(/(?:^|;\s*)proinshop_zona=(-?\d+)/)?.[1];
  if (actual === String(minutos)) return false;
  document.cookie = `proinshop_zona=${minutos}; path=/; max-age=31536000; samesite=lax; secure`;
  return true;
}
