import { baseDeDatos } from "@/lib/d1";
import { escribirCsv } from "@/lib/csv";
import { puede, usuarioActual } from "@/lib/sesion";
import { hoyEnZona } from "@/lib/reportes";
import { minutosZona } from "@/lib/zona";

/**
 * Descarga el inventario como Excel (CSV). Con ?plantilla=1 baja solo los
 * encabezados y un renglón de ejemplo, para cargar productos nuevos.
 * El costo solo va si la persona tiene permiso de ver costos.
 */
export async function GET(peticion: Request) {
  const usuario = await usuarioActual();
  if (!usuario || !puede(usuario, "inventario")) {
    return new Response("Necesitas permiso de inventario", { status: 403 });
  }
  const conCosto = puede(usuario, "costos");
  const plantilla = new URL(peticion.url).searchParams.has("plantilla");

  const encabezados = [
    "id",
    "nombre",
    "nombre_en",
    "categoria",
    "precio",
    ...(conCosto ? ["costo"] : []),
    "stock",
    "stock_minimo",
    "codigo_barras",
    "sku",
    "publicado",
    "servicio",
    "descripcion",
    "descripcion_en",
  ];

  const filas: unknown[][] = [encabezados];

  if (plantilla) {
    filas.push([
      "",
      "Nombre del producto",
      "Product name",
      "Nombre de la categoría",
      "100",
      ...(conCosto ? ["70"] : []),
      "10",
      "3",
      "",
      "",
      "si",
      "no",
      "Descripción para la tienda",
      "Store description",
    ]);
  } else {
    const db = await baseDeDatos();
    const { results } = db
      ? await db
          .prepare(
            `SELECT p.id, p.nombre_es, p.nombre_en, c.nombre_es AS categoria, p.precio, p.costo, p.stock,
                    p.stock_minimo, p.codigo_barras, p.sku, p.publicado, COALESCE(p.es_servicio, 0) AS es_servicio,
                    p.descripcion_es, p.descripcion_en
             FROM producto p LEFT JOIN categoria c ON c.id = p.categoria_id ORDER BY p.nombre_es`,
          )
          .all<Record<string, string | number | null>>()
      : { results: [] };
    for (const p of results) {
      filas.push([
        p.id,
        p.nombre_es,
        p.nombre_en,
        p.categoria,
        p.precio,
        ...(conCosto ? [p.costo] : []),
        p.stock,
        p.stock_minimo,
        p.codigo_barras,
        p.sku,
        p.publicado ? "si" : "no",
        p.es_servicio ? "si" : "no",
        p.descripcion_es,
        p.descripcion_en,
      ]);
    }
  }

  // La fecha del negocio, no la universal: de noche ya sería «mañana».
  const fecha = hoyEnZona(await minutosZona());
  return new Response(escribirCsv(filas), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${plantilla ? "plantilla-productos" : `inventario-${fecha}`}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
