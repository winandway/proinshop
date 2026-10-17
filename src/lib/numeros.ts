/**
 * Lee un monto tal como lo escribe una persona, no como lo espera una
 * computadora.
 *
 * Antes "1.890" se guardaba como 1,89: el punto se tomaba como decimal. Aquí
 * se mira el formato completo: un separador seguido de grupos de tres cifras
 * es de miles ("1.890", "12.500.000", "1,890"); si hay punto y coma, el último
 * que aparece es el decimal ("1.890,50" y "1,890.50" son lo mismo).
 */
export function leerMonto(valor: unknown): number {
  let texto = String(valor ?? "")
    .trim()
    .replace(/[^\d.,-]/g, "");
  if (!texto) return 0;

  const negativo = texto.startsWith("-");
  texto = texto.replace(/-/g, "");

  const ultimoPunto = texto.lastIndexOf(".");
  const ultimaComa = texto.lastIndexOf(",");
  let entero = texto;
  let decimal = "";

  if (ultimoPunto >= 0 && ultimaComa >= 0) {
    const separador = Math.max(ultimoPunto, ultimaComa);
    entero = texto.slice(0, separador);
    decimal = texto.slice(separador + 1);
  } else if (ultimoPunto >= 0 || ultimaComa >= 0) {
    const partes = texto.split(ultimoPunto >= 0 ? "." : ",");
    const primera = partes[0] ?? "";
    const sonMiles =
      partes.length > 1 &&
      primera.length >= 1 &&
      primera.length <= 3 &&
      primera !== "0" &&
      partes.slice(1).every((parte) => parte.length === 3);

    if (sonMiles) {
      entero = partes.join("");
    } else {
      decimal = partes.pop() ?? "";
      entero = partes.join("");
    }
  }

  entero = entero.replace(/[.,]/g, "") || "0";
  decimal = decimal.replace(/[.,]/g, "") || "0";
  const numero = Number(`${entero}.${decimal}`);
  if (!Number.isFinite(numero)) return 0;
  return negativo ? -numero : numero;
}
