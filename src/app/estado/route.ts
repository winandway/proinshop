import { baseDeDatos, bucket } from "@/lib/d1";

/**
 * Comprobación de que el sitio está bien conectado a sus recursos.
 * Sirve para verificar el despliegue de un vistazo: /estado
 *
 * Es el canario de la base: además de leer, escribe un latido y lo vuelve a
 * leer, y revisa que existan todas las tablas y columnas que el sistema usa.
 * Si algo falla responde 503 y `estado: "error"`, para que se note.
 */

/** Lo que tiene que existir en la base para que todo el panel funcione. */
const TABLAS_NECESARIAS = [
  "negocio", "usuario", "sesion", "categoria", "producto", "variante", "cliente",
  "venta", "venta_item", "venta_pago", "deuda", "abono", "pedido", "cotizacion",
  "gasto", "proveedor", "compra", "caja", "conteo", "actividad", "llave_acceso",
  "reto_llave", "movimiento_inventario", "suscripcion_aviso",
];
const COLUMNAS_NECESARIAS: [string, string][] = [
  ["venta", "anulada"], ["venta", "clave"], ["venta", "nota"], ["producto", "es_servicio"],
  ["usuario", "permisos"], ["negocio", "umbral_stock"], ["negocio", "moneda2"], ["compra", "metodo_pago"],
];

export async function GET() {
  const informe: Record<string, unknown> = {
    revisado: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_VERSION ?? "local",
  };
  let sano = true;

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

      // Escribir y volver a leer: una base que solo deja leer no sirve.
      await db.batch([
        db.prepare(
          "CREATE TABLE IF NOT EXISTS salud (id INTEGER PRIMARY KEY CHECK (id = 1), latido TEXT NOT NULL)",
        ),
        db.prepare("INSERT OR REPLACE INTO salud (id, latido) VALUES (1, datetime('now'))"),
      ]);
      const latido = await db.prepare("SELECT latido FROM salud WHERE id = 1").first<{ latido: string }>();
      informe.escritura = { funciona: Boolean(latido?.latido), latido: latido?.latido ?? null };
      if (!latido?.latido) sano = false;

      const { results: tablas } = await db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all<{ name: string }>();
      const existentes = new Set(tablas.map((tabla) => tabla.name));
      const faltanTablas = TABLAS_NECESARIAS.filter((tabla) => !existentes.has(tabla));
      const faltanColumnas: string[] = [];
      for (const [tabla, columna] of COLUMNAS_NECESARIAS) {
        if (!existentes.has(tabla)) continue;
        const { results } = await db.prepare(`PRAGMA table_info(${tabla})`).all<{ name: string }>();
        if (!results.some((fila) => fila.name === columna)) faltanColumnas.push(`${tabla}.${columna}`);
      }
      informe.esquema = {
        completo: faltanTablas.length === 0 && faltanColumnas.length === 0,
        tablas: TABLAS_NECESARIAS.length - faltanTablas.length,
        faltan: [...faltanTablas, ...faltanColumnas],
      };
      if (faltanTablas.length || faltanColumnas.length) sano = false;
    }
  } catch (error) {
    informe.baseDeDatos = { conectada: false, motivo: String(error) };
  }
  const base = informe.baseDeDatos as { conectada?: boolean } | undefined;
  if (!base?.conectada) sano = false;

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
  const almacenamiento = informe.almacenamiento as { conectado?: boolean } | undefined;
  if (!almacenamiento?.conectado) sano = false;

  return Response.json(
    { estado: sano ? "ok" : "error", ...informe },
    { status: sano ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
