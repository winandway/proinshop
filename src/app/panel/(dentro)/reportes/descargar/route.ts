import { baseDeDatos } from "@/lib/d1";
import { escribirCsv } from "@/lib/csv";
import { NOMBRE_METODO } from "@/lib/metodos";
import { condicionGastos, condicionVentas, hoyEnZona, leerFiltros } from "@/lib/reportes";
import { puede, usuarioActual } from "@/lib/sesion";
import { horaLocal, minutosZona, modificadorZona } from "@/lib/zona";

/** Descarga el reporte con los mismos filtros de la pantalla, en Excel (CSV). */
export async function GET(peticion: Request) {
  const usuario = await usuarioActual();
  if (!usuario || !puede(usuario, "reportes")) {
    return new Response("Necesitas permiso de reportes", { status: 403 });
  }
  const verCostos = puede(usuario, "costos");
  const db = await baseDeDatos();
  if (!db) return new Response("Base no disponible", { status: 503 });

  const parametros = Object.fromEntries(new URL(peticion.url).searchParams);
  const minutos = await minutosZona();
  const zona = await modificadorZona();
  const filtros = leerFiltros(parametros, hoyEnZona(minutos));
  const tipo = parametros.tipo === "gastos" || parametros.tipo === "productos" ? parametros.tipo : "ventas";

  let filas: unknown[][] = [];
  if (tipo === "ventas") {
    const ventas = condicionVentas(filtros, zona);
    const { results } = await db
      .prepare(
        `SELECT v.id, v.fecha, v.canal, v.subtotal, v.descuento, v.total, v.metodo_pago, v.nota,
                c.nombre AS cliente, u.nombre AS vendedor,
                (SELECT GROUP_CONCAT(cantidad || ' x ' || descripcion, ' | ') FROM venta_item WHERE venta_id = v.id) AS detalle,
                (SELECT SUM(costo_unit * cantidad) FROM venta_item WHERE venta_id = v.id) AS costo
         FROM venta v LEFT JOIN cliente c ON c.id = v.cliente_id LEFT JOIN usuario u ON u.id = v.usuario_id
         WHERE ${ventas.sql} ORDER BY v.id`,
      )
      .bind(...ventas.valores)
      .all<Record<string, string | number | null>>();
    filas = [
      ["venta", "fecha", "canal", "cliente", "vendedor", "productos", "subtotal", "descuento", "total", ...(verCostos ? ["costo", "ganancia"] : []), "pago", "nota"],
      ...results.map((v) => [
        v.id,
        horaLocal(String(v.fecha), minutos),
        v.canal === "web" ? "tienda" : "local",
        v.cliente,
        v.vendedor,
        v.detalle,
        v.subtotal,
        v.descuento,
        v.total,
        ...(verCostos ? [v.costo, Number(v.total) - Number(v.costo ?? 0)] : []),
        NOMBRE_METODO[String(v.metodo_pago)] ?? v.metodo_pago,
        v.nota,
      ]),
    ];
  } else if (tipo === "productos") {
    const ventas = condicionVentas(filtros, zona);
    const { results } = await db
      .prepare(
        `SELECT vi.descripcion, SUM(vi.cantidad) AS unidades, SUM(vi.precio_unit * vi.cantidad) AS vendido,
                SUM(vi.costo_unit * vi.cantidad) AS costo
         FROM venta_item vi JOIN venta v ON v.id = vi.venta_id WHERE ${ventas.sql}
         GROUP BY vi.descripcion ORDER BY unidades DESC`,
      )
      .bind(...ventas.valores)
      .all<Record<string, string | number | null>>();
    filas = [
      ["producto", "unidades", "vendido", ...(verCostos ? ["costo", "ganancia"] : [])],
      ...results.map((p) => [
        p.descripcion,
        p.unidades,
        p.vendido,
        ...(verCostos ? [p.costo, Number(p.vendido) - Number(p.costo ?? 0)] : []),
      ]),
    ];
  } else {
    const gastos = condicionGastos(filtros, zona);
    const { results } = await db
      .prepare(
        `SELECT g.fecha, g.categoria, g.monto, g.metodo_pago, g.nota, p.nombre AS proveedor
         FROM gasto g LEFT JOIN proveedor p ON p.id = g.proveedor_id WHERE ${gastos.sql} ORDER BY g.id`,
      )
      .bind(...gastos.valores)
      .all<Record<string, string | number | null>>();
    filas = [
      ["fecha", "categoria", "monto", "pago", "proveedor", "nota"],
      ...results.map((g) => [
        horaLocal(String(g.fecha), minutos),
        g.categoria,
        g.monto,
        NOMBRE_METODO[String(g.metodo_pago)] ?? g.metodo_pago,
        g.proveedor,
        g.nota,
      ]),
    ];
  }

  return new Response(escribirCsv(filas), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${tipo}-${filtros.desde}-a-${filtros.hasta}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
