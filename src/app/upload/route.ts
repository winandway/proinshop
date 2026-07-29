import { baseDeDatos, bucket } from "@/lib/d1";

/**
 * Sube un archivo al bucket del sitio (`env.BUCKET`).
 *
 * R2 no tiene API pública: solo se puede escribir desde el worker. Esta ruta
 * es la puerta, y en la Etapa 3 la usa la app de administración cuando el
 * dueño toma la foto del producto con el celular.
 *
 * Autorización: un código de un solo uso guardado en la tabla `codigo_subida`.
 * Solo quien tenga el token de la base puede crear códigos, así que no hace
 * falta ningún secreto dentro del repositorio (que es público).
 *
 * La ruta es `/upload` y no `/api/upload`: en YaDominios Cloud las rutas
 * `/api/` chocan con los archivos estáticos.
 */

const TAMANO_MAXIMO = 15 * 1024 * 1024; // 15 MB: una foto de celular cabe de sobra.

export async function POST(peticion: Request) {
  const db = await baseDeDatos();
  const almacen = await bucket();

  if (!db || !almacen) {
    return Response.json({ error: "Base o almacenamiento no disponibles" }, { status: 503 });
  }

  const codigo = peticion.headers.get("x-codigo-subida");
  if (!codigo) {
    return Response.json({ error: "Falta el código de subida" }, { status: 401 });
  }

  const fila = await db
    .prepare(
      `SELECT codigo FROM codigo_subida
       WHERE codigo = ? AND usado = 0 AND expira > datetime('now')`,
    )
    .bind(codigo)
    .first<{ codigo: string }>();

  if (!fila) {
    return Response.json({ error: "Código inválido, usado o vencido" }, { status: 403 });
  }

  const formulario = await peticion.formData();
  const archivo = formulario.get("archivo");
  if (!(archivo instanceof File)) {
    return Response.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return Response.json({ error: "El archivo pesa más de 15 MB" }, { status: 413 });
  }

  const claveSolicitada = String(formulario.get("clave") ?? "").trim();
  // Se limpia la clave para que nadie escriba fuera de su carpeta.
  const clave =
    claveSolicitada.replace(/^\/+/, "").replace(/\.\./g, "").replace(/[^\w./-]/g, "-") ||
    `productos/${Date.now()}-${archivo.name}`;

  await almacen.put(clave, await archivo.arrayBuffer(), {
    httpMetadata: { contentType: archivo.type || "application/octet-stream" },
  });

  // El código se quema aunque el resto falle: un código, una subida.
  await db.prepare("UPDATE codigo_subida SET usado = 1 WHERE codigo = ?").bind(codigo).run();

  // Si la subida es la foto de un producto, queda vinculada al vuelo.
  const productoId = Number(formulario.get("producto_id") ?? 0);
  if (productoId > 0) {
    await db
      .prepare(
        `INSERT INTO foto (producto_id, clave_r2, clave_r2_web, orden)
         VALUES (?, ?, ?, (SELECT COALESCE(MAX(orden) + 1, 0) FROM foto WHERE producto_id = ?))`,
      )
      .bind(productoId, clave, clave, productoId)
      .run();
  }

  return Response.json({
    guardado: true,
    clave,
    url: `/media/${clave}`,
    bytes: archivo.size,
    productoId: productoId > 0 ? productoId : null,
  });
}
