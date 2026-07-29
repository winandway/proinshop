import { baseDeDatos, bucket } from "@/lib/d1";

/**
 * Comprobación de que el sitio está bien conectado a sus recursos.
 * Sirve para verificar el despliegue de un vistazo: /estado
 */
export async function GET() {
  const informe: Record<string, unknown> = { revisado: new Date().toISOString() };

  try {
    const db = await baseDeDatos();
    if (!db) {
      informe.baseDeDatos = { conectada: false, motivo: "sin binding DB" };
    } else {
      const fila = await db
        .prepare(
          `SELECT (SELECT COUNT(*) FROM categoria) AS categorias,
                  (SELECT COUNT(*) FROM producto WHERE publicado = 1) AS productos,
                  (SELECT COUNT(*) FROM pedido) AS pedidos`,
        )
        .first<{ categorias: number; productos: number; pedidos: number }>();
      informe.baseDeDatos = { conectada: true, ...fila };
    }
  } catch (error) {
    informe.baseDeDatos = { conectada: false, motivo: String(error) };
  }

  try {
    const almacen = await bucket();
    if (!almacen) {
      informe.almacenamiento = { conectado: false, motivo: "sin binding BUCKET" };
    } else {
      // El listado viene por páginas: hay que recorrerlas o el conteo se queda
      // en el tamaño de la primera página y siempre informa de menos.
      let archivos = 0;
      let bytes = 0;
      let cursor: string | undefined;
      do {
        const pagina = await almacen.list({ cursor });
        archivos += pagina.objects.length;
        bytes += pagina.objects.reduce((suma, objeto) => suma + objeto.size, 0);
        cursor = pagina.truncated ? pagina.cursor : undefined;
      } while (cursor);

      informe.almacenamiento = { conectado: true, archivos, bytes };
    }
  } catch (error) {
    informe.almacenamiento = { conectado: false, motivo: String(error) };
  }

  return Response.json(informe, {
    headers: { "cache-control": "no-store" },
  });
}
