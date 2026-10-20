/**
 * Leer y escribir archivos de Excel en formato CSV.
 *
 * Excel en español guarda los CSV con punto y coma; en inglés, con coma. Se
 * detecta solo mirando la primera línea. Las comillas, las comas dentro de un
 * texto y los saltos de línea dentro de una celda se respetan.
 */

export function detectarSeparador(texto: string): string {
  const primera = texto.split(/\r?\n/, 1)[0] ?? "";
  const cuenta = (caracter: string) => primera.split(caracter).length - 1;
  if (cuenta(";") > cuenta(",") && cuenta(";") >= cuenta("\t")) return ";";
  if (cuenta("\t") > cuenta(",")) return "\t";
  return ",";
}

export function leerCsv(textoCrudo: string): string[][] {
  const texto = textoCrudo.replace(/^﻿/, "");
  const separador = detectarSeparador(texto);
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;

  for (let i = 0; i < texto.length; i += 1) {
    const caracter = texto[i]!;
    if (entreComillas) {
      if (caracter === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i += 1;
        } else {
          entreComillas = false;
        }
      } else {
        celda += caracter;
      }
      continue;
    }
    if (caracter === '"') entreComillas = true;
    else if (caracter === separador) {
      fila.push(celda);
      celda = "";
    } else if (caracter === "\n" || caracter === "\r") {
      if (caracter === "\r" && texto[i + 1] === "\n") i += 1;
      fila.push(celda);
      if (fila.some((valor) => valor.trim() !== "")) filas.push(fila);
      fila = [];
      celda = "";
    } else celda += caracter;
  }
  fila.push(celda);
  if (fila.some((valor) => valor.trim() !== "")) filas.push(fila);
  return filas;
}

/** "Código de barras" → "codigo_de_barras", para reconocer encabezados escritos a mano. */
export function normalizarEncabezado(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function celdaCsv(valor: unknown, separador: string): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return /["\n\r]/.test(texto) || texto.includes(separador) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Arma el archivo. Lleva la marca BOM para que Excel abra bien las tildes y
 * punto y coma para que Excel en español lo separe en columnas solo.
 */
export function escribirCsv(filas: unknown[][], separador = ";"): string {
  return "﻿" + filas.map((fila) => fila.map((v) => celdaCsv(v, separador)).join(separador)).join("\r\n");
}
