/**
 * Arma un cuerpo `multipart/form-data` a mano.
 *
 * El `FormData` de Node se envía troceado (`Transfer-Encoding: chunked`) y el
 * worker no lo parsea: devuelve 500. Con el cuerpo ya armado en un búfer,
 * `fetch` manda un `Content-Length` normal y lo recibe bien. Comprobado
 * contra proinshop.com.
 */

const TIPOS = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export function tipoPorExtension(nombre) {
  const extension = nombre.split(".").pop()?.toLowerCase() ?? "";
  return TIPOS[extension] ?? "application/octet-stream";
}

/**
 * @param {Record<string, string>} campos  campos de texto
 * @param {{ nombre: string, contenido: Buffer, tipo?: string }} archivo
 */
export function armarMultipart(campos, archivo) {
  const limite =
    "----proinshop" +
    [...crypto.getRandomValues(new Uint8Array(12))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const partes = [];

  for (const [nombre, valor] of Object.entries(campos)) {
    if (valor === undefined || valor === null || valor === "") continue;
    partes.push(
      Buffer.from(
        `--${limite}\r\nContent-Disposition: form-data; name="${nombre}"\r\n\r\n${valor}\r\n`,
      ),
    );
  }

  partes.push(
    Buffer.from(
      `--${limite}\r\n` +
        `Content-Disposition: form-data; name="archivo"; filename="${archivo.nombre}"\r\n` +
        `Content-Type: ${archivo.tipo ?? tipoPorExtension(archivo.nombre)}\r\n\r\n`,
    ),
  );
  partes.push(archivo.contenido);
  partes.push(Buffer.from(`\r\n--${limite}--\r\n`));

  return {
    cuerpo: Buffer.concat(partes),
    tipoContenido: `multipart/form-data; boundary=${limite}`,
  };
}
