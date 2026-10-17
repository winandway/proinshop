/**
 * Achica la foto en el celular antes de subirla.
 *
 * Una foto de cámara pesa de 2 a 6 MB y mide 4000 px: subirla con datos
 * móviles tarda y para la tienda sobra. Se deja en 1600 px de lado mayor, en
 * JPEG, que queda en unos 300 KB y se ve igual de nítida en cualquier
 * pantalla. Si el navegador no puede (formato raro, memoria), se sube la
 * original: nunca se pierde la foto por intentar achicarla.
 */

const LADO_MAXIMO = 1600;
const CALIDAD = 0.82;

export async function achicarFoto(archivo: File): Promise<File> {
  if (!archivo.type.startsWith("image/") || archivo.type === "image/gif") return archivo;

  try {
    const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const ancho = Math.round(imagen.width * escala);
    const alto = Math.round(imagen.height * escala);

    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext("2d");
    if (!contexto) return archivo;

    // Fondo blanco: un PNG con transparencia no queda negro al pasar a JPEG.
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, ancho, alto);
    contexto.drawImage(imagen, 0, 0, ancho, alto);
    imagen.close();

    const blob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, "image/jpeg", CALIDAD),
    );
    if (!blob || blob.size >= archivo.size) return archivo;

    const nombre = archivo.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${nombre}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return archivo;
  }
}

/**
 * Cambia el archivo del campo por su versión achicada, para que el
 * formulario envíe la liviana sin tocar nada más.
 */
export async function achicarEnCampo(campo: HTMLInputElement): Promise<File | null> {
  const original = campo.files?.[0];
  if (!original) return null;

  const liviana = await achicarFoto(original);
  if (liviana !== original) {
    try {
      const transferencia = new DataTransfer();
      transferencia.items.add(liviana);
      campo.files = transferencia.files;
    } catch {
      // Navegador viejo sin DataTransfer: se queda la original, que igual cabe.
      return original;
    }
  }
  return liviana;
}
