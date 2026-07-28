import { bucket } from "@/lib/d1";

/**
 * Sirve las fotos de los productos desde el bucket del sitio (`env.BUCKET`).
 *
 * La ruta es `/media/...` y no `/api/...` a propósito: en YaDominios Cloud
 * las rutas `/api/` chocan con los archivos estáticos.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ clave: string[] }> },
) {
  const { clave } = await params;
  const ruta = clave.join("/");

  const almacen = await bucket();
  if (!almacen) {
    return new Response("Almacenamiento no disponible", { status: 503 });
  }

  const objeto = await almacen.get(ruta);
  if (!objeto) {
    return new Response("No encontrado", { status: 404 });
  }

  const cabeceras = new Headers();
  objeto.writeHttpMetadata(cabeceras as unknown as Parameters<typeof objeto.writeHttpMetadata>[0]);
  cabeceras.set("etag", objeto.httpEtag);

  // Si el archivo se subió sin tipo, se deduce de la extensión: sin esto el
  // navegador recibe la imagen sin saber que lo es y no la pinta.
  if (!cabeceras.get("content-type")) {
    const tipos: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      avif: "image/avif",
      gif: "image/gif",
      svg: "image/svg+xml",
      pdf: "application/pdf",
    };
    const extension = ruta.split(".").pop()?.toLowerCase() ?? "";
    cabeceras.set("content-type", tipos[extension] ?? "application/octet-stream");
  }

  // Las fotos se guardan con nombre único al subirlas: se pueden cachear fuerte.
  cabeceras.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(objeto.body as unknown as BodyInit, { headers: cabeceras });
}
