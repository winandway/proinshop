import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { NOMBRE_METODO } from "@/lib/metodos";
import { BotonImprimir } from "@/componentes/panel/BotonImprimir";
import {
  cambioPorcentual,
  condicionGastos,
  condicionVentas,
  filtrosEnDireccion,
  hoyEnZona,
  leerFiltros,
  periodoAnterior,
} from "@/lib/reportes";
import { exigir, puede } from "@/lib/sesion";
import { horaLocal, minutosZona, modificadorZona } from "@/lib/zona";

export const metadata: Metadata = { title: "Reportes", robots: { index: false } };

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea bg-white px-3 py-2.5 text-[12.5px] font-semibold outline-none focus:border-rojo";

function Tabla({ titulo, filas }: { titulo: string; filas: { nombre: string; detalle?: string; monto: number }[] }) {
  if (filas.length === 0) return null;
  const maximo = Math.max(...filas.map((f) => f.monto), 1);
  return (
    <section className="mb-3 rounded-2xl bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none">
      <h2 className="mb-2 text-[13px] font-extrabold">{titulo}</h2>
      <ul className="space-y-2">
        {filas.map((fila) => (
          <li key={fila.nombre}>
            <p className="flex justify-between text-[12.5px]">
              <span className="font-bold">
                {fila.nombre}
                {fila.detalle && <span className="font-normal text-gris"> · {fila.detalle}</span>}
              </span>
              <span className="font-black">{formatearPrecio(fila.monto)}</span>
            </p>
            <span aria-hidden="true" className="mt-1 block h-1.5 rounded-full bg-crema">
              <span
                className="block h-1.5 rounded-full bg-verde"
                style={{ width: `${Math.max(3, Math.round((fila.monto / maximo) * 100))}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Reportes como en Treinta: se elige el rango de fechas y, si se quiere, un
 * empleado, un método de pago, un producto o el canal, y se ve cuánto se
 * vendió, qué se vendió, quién vendió y cómo pagaron. Se descarga en Excel o
 * se imprime / guarda en PDF.
 */
export default async function Reportes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const usuario = await exigir("reportes");
  const verCostos = puede(usuario, "costos");
  const parametros = await searchParams;
  const minutos = await minutosZona();
  const zona = await modificadorZona();
  const filtros = leerFiltros(parametros, hoyEnZona(minutos));
  const db = await baseDeDatos();
  if (!db) return null;

  const ventas = condicionVentas(filtros, zona);
  const gastos = condicionGastos(filtros, zona);
  const filtroProducto = filtros.producto ? " AND vi.producto_id = ?" : "";
  const valorProducto = filtros.producto ? [filtros.producto] : [];

  const [resumen, gastado, porMetodo, porEmpleado, porProducto, porDia, porCategoria, lista, empleados, productos] =
    await Promise.all([
      db
        .prepare(
          `SELECT COUNT(*) AS ventas, COALESCE(SUM(v.total), 0) AS ingresos,
                  COALESCE(SUM(v.descuento), 0) AS descuentos,
                  COALESCE((SELECT SUM(vi.costo_unit * vi.cantidad) FROM venta_item vi
                            JOIN venta v ON v.id = vi.venta_id WHERE ${ventas.sql}), 0) AS costo
           FROM venta v WHERE ${ventas.sql}`,
        )
        .bind(...ventas.valores, ...ventas.valores)
        .first<{ ventas: number; ingresos: number; descuentos: number; costo: number }>(),
      db
        .prepare(`SELECT COALESCE(SUM(g.monto), 0) AS total FROM gasto g WHERE ${gastos.sql}`)
        .bind(...gastos.valores)
        .first<{ total: number }>(),
      db
        .prepare(
          `SELECT p.metodo AS nombre, SUM(p.monto) AS monto, COUNT(DISTINCT v.id) AS ventas
           FROM venta_pago p JOIN venta v ON v.id = p.venta_id WHERE ${ventas.sql}
           ${filtros.metodo ? "AND p.metodo = ?" : ""}
           GROUP BY p.metodo ORDER BY monto DESC`,
        )
        .bind(...ventas.valores, ...(filtros.metodo ? [filtros.metodo] : []))
        .all<{ nombre: string; monto: number; ventas: number }>(),
      db
        .prepare(
          `SELECT COALESCE(u.nombre, 'Tienda en línea') AS nombre, SUM(v.total) AS monto, COUNT(*) AS ventas
           FROM venta v LEFT JOIN usuario u ON u.id = v.usuario_id WHERE ${ventas.sql}
           GROUP BY v.usuario_id ORDER BY monto DESC`,
        )
        .bind(...ventas.valores)
        .all<{ nombre: string; monto: number; ventas: number }>(),
      db
        .prepare(
          `SELECT vi.descripcion AS nombre, SUM(vi.cantidad) AS unidades,
                  SUM(vi.precio_unit * vi.cantidad) AS monto,
                  SUM((vi.precio_unit - vi.costo_unit) * vi.cantidad) AS ganancia
           FROM venta_item vi JOIN venta v ON v.id = vi.venta_id
           WHERE ${ventas.sql}${filtroProducto}
           GROUP BY vi.descripcion ORDER BY unidades DESC LIMIT 15`,
        )
        .bind(...ventas.valores, ...valorProducto)
        .all<{ nombre: string; unidades: number; monto: number; ganancia: number }>(),
      db
        .prepare(
          `SELECT date(v.fecha, ${zona}) AS dia, SUM(v.total) AS monto, COUNT(*) AS ventas
           FROM venta v WHERE ${ventas.sql} GROUP BY dia ORDER BY dia DESC LIMIT 62`,
        )
        .bind(...ventas.valores)
        .all<{ dia: string; monto: number; ventas: number }>(),
      db
        .prepare(
          `SELECT g.categoria AS nombre, SUM(g.monto) AS monto FROM gasto g WHERE ${gastos.sql}
           GROUP BY g.categoria ORDER BY monto DESC`,
        )
        .bind(...gastos.valores)
        .all<{ nombre: string; monto: number }>(),
      db
        .prepare(
          `SELECT v.id, v.fecha, v.total, v.metodo_pago, v.canal, c.nombre AS cliente, u.nombre AS vendedor
           FROM venta v LEFT JOIN cliente c ON c.id = v.cliente_id LEFT JOIN usuario u ON u.id = v.usuario_id
           WHERE ${ventas.sql} ORDER BY v.id DESC LIMIT 100`,
        )
        .bind(...ventas.valores)
        .all<{ id: number; fecha: string; total: number; metodo_pago: string; canal: string; cliente: string | null; vendedor: string | null }>(),
      db.prepare("SELECT id, nombre FROM usuario ORDER BY nombre").all<{ id: number; nombre: string }>(),
      db.prepare("SELECT id, nombre_es FROM producto ORDER BY nombre_es").all<{ id: number; nombre_es: string }>(),
    ]);

  const ingresos = resumen?.ingresos ?? 0;
  const costo = resumen?.costo ?? 0;
  const egresos = gastado?.total ?? 0;
  const numeroVentas = resumen?.ventas ?? 0;
  const direccion = filtrosEnDireccion(filtros);

  // El mismo reporte, con los mismos filtros, en el período de antes.
  const antes = periodoAnterior(filtros.desde, filtros.hasta);
  const ventasAntes = condicionVentas({ ...filtros, ...antes }, zona);
  const gastosAntes = condicionGastos({ ...filtros, ...antes }, zona);
  const [resumenAntes, gastadoAntes] = await Promise.all([
    db
      .prepare(
        `SELECT COUNT(*) AS ventas, COALESCE(SUM(v.total), 0) AS ingresos,
                COALESCE((SELECT SUM(vi.costo_unit * vi.cantidad) FROM venta_item vi
                          JOIN venta v ON v.id = vi.venta_id WHERE ${ventasAntes.sql}), 0) AS costo
         FROM venta v WHERE ${ventasAntes.sql}`,
      )
      .bind(...ventasAntes.valores, ...ventasAntes.valores)
      .first<{ ventas: number; ingresos: number; costo: number }>(),
    db
      .prepare(`SELECT COALESCE(SUM(g.monto), 0) AS total FROM gasto g WHERE ${gastosAntes.sql}`)
      .bind(...gastosAntes.valores)
      .first<{ total: number }>(),
  ]);
  const ingresosAntes = resumenAntes?.ingresos ?? 0;
  const ventasAntesNumero = resumenAntes?.ventas ?? 0;
  const costoAntes = resumenAntes?.costo ?? 0;
  const egresosAntes = gastadoAntes?.total ?? 0;

  return (
    <div className="pb-6">
      <div className="mb-4 flex items-center gap-3 print:hidden">
        <Link
          href="/panel/balance"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Reportes</h1>
      </div>

      <p className="mb-3 hidden text-[13px] font-bold print:block">
        Reporte del {filtros.desde} al {filtros.hasta}
      </p>

      <form className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 shadow-sm sm:grid-cols-3 print:hidden">
        <label className="text-[11px] font-bold text-gris">
          Desde
          <input type="date" name="desde" defaultValue={filtros.desde} className={`${CAMPO} mt-1`} />
        </label>
        <label className="text-[11px] font-bold text-gris">
          Hasta
          <input type="date" name="hasta" defaultValue={filtros.hasta} className={`${CAMPO} mt-1`} />
        </label>
        <label className="text-[11px] font-bold text-gris">
          Empleado
          <select name="empleado" defaultValue={filtros.empleado ?? ""} className={`${CAMPO} mt-1`}>
            <option value="">Todos</option>
            {empleados.results.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-bold text-gris">
          Método de pago
          <select name="metodo" defaultValue={filtros.metodo ?? ""} className={`${CAMPO} mt-1`}>
            <option value="">Todos</option>
            {["efectivo", "transferencia", "tarjeta", "fiado", "contraentrega"].map((m) => (
              <option key={m} value={m}>
                {NOMBRE_METODO[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-bold text-gris">
          Producto
          <select name="producto" defaultValue={filtros.producto ?? ""} className={`${CAMPO} mt-1`}>
            <option value="">Todos</option>
            {productos.results.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_es}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-bold text-gris">
          Canal
          <select name="canal" defaultValue={filtros.canal ?? ""} className={`${CAMPO} mt-1`}>
            <option value="">Local y tienda</option>
            <option value="local">En el local</option>
            <option value="web">Tienda en línea</option>
          </select>
        </label>
        <button
          type="submit"
          className="col-span-2 rounded-xl bg-tinta py-2.5 text-[12.5px] font-extrabold text-white sm:col-span-3"
        >
          Ver reporte
        </button>
      </form>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            { texto: "Vendido", valor: formatearPrecio(ingresos), cambio: cambioPorcentual(ingresos, ingresosAntes) },
            { texto: "Ventas", valor: String(numeroVentas), cambio: cambioPorcentual(numeroVentas, ventasAntesNumero) },
            {
              texto: "Ticket promedio",
              valor: formatearPrecio(numeroVentas ? ingresos / numeroVentas : 0),
              cambio: cambioPorcentual(
                numeroVentas ? ingresos / numeroVentas : 0,
                ventasAntesNumero ? ingresosAntes / ventasAntesNumero : 0,
              ),
            },
            // En los gastos, subir es lo malo.
            { texto: "Gastos", valor: formatearPrecio(egresos), cambio: cambioPorcentual(egresos, egresosAntes), alReves: true },
            ...(verCostos
              ? [
                  { texto: "Costo de lo vendido", valor: formatearPrecio(costo), cambio: null },
                  {
                    texto: "Ganancia bruta",
                    valor: formatearPrecio(ingresos - costo),
                    cambio: cambioPorcentual(ingresos - costo, ingresosAntes - costoAntes),
                  },
                  {
                    texto: "Utilidad (− gastos)",
                    valor: formatearPrecio(ingresos - costo - egresos),
                    cambio: cambioPorcentual(ingresos - costo - egresos, ingresosAntes - costoAntes - egresosAntes),
                  },
                  { texto: "Descuentos dados", valor: formatearPrecio(resumen?.descuentos ?? 0), cambio: null },
                ]
              : []),
          ] as { texto: string; valor: string; cambio: number | null; alReves?: boolean }[]
        ).map((dato) => {
          const bueno = dato.cambio !== null && (dato.alReves ? dato.cambio <= 0 : dato.cambio >= 0);
          return (
            <div key={dato.texto} className="rounded-2xl bg-white p-3 shadow-sm print:shadow-none">
              <p className="text-[10.5px] font-semibold text-gris">{dato.texto}</p>
              <p className="mt-0.5 text-[16px] font-black tracking-tight">{dato.valor}</p>
              {dato.cambio !== null && (
                <p className={`text-[10.5px] font-bold ${bueno ? "text-verde" : "text-rojo-oscuro"}`}>
                  {dato.cambio > 0 ? "↑" : dato.cambio < 0 ? "↓" : "="} {Math.abs(dato.cambio)}% vs. antes
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="-mt-1.5 mb-3 text-[11px] text-gris">
        «Antes» es del {antes.desde} al {antes.hasta}, el mismo número de días justo antes.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2 print:hidden">
        <a
          href={`/panel/reportes/descargar?tipo=ventas&${direccion}`}
          download
          className="rounded-xl border-[1.5px] border-linea bg-white py-2.5 text-center text-[12px] font-bold"
        >
          📤 Ventas en Excel
        </a>
        <a
          href={`/panel/reportes/descargar?tipo=productos&${direccion}`}
          download
          className="rounded-xl border-[1.5px] border-linea bg-white py-2.5 text-center text-[12px] font-bold"
        >
          📤 Productos en Excel
        </a>
        <a
          href={`/panel/reportes/descargar?tipo=gastos&${direccion}`}
          download
          className="rounded-xl border-[1.5px] border-linea bg-white py-2.5 text-center text-[12px] font-bold"
        >
          📤 Gastos en Excel
        </a>
        <BotonImprimir texto="Imprimir / PDF" />
      </div>

      <Tabla
        titulo="Por método de pago"
        filas={porMetodo.results.map((m) => ({
          nombre: NOMBRE_METODO[m.nombre] ?? m.nombre,
          detalle: `${m.ventas} ventas`,
          monto: m.monto,
        }))}
      />
      <Tabla
        titulo="Por empleado"
        filas={porEmpleado.results.map((e) => ({ nombre: e.nombre, detalle: `${e.ventas} ventas`, monto: e.monto }))}
      />
      <Tabla
        titulo="Productos más vendidos"
        filas={porProducto.results.map((p) => ({
          nombre: p.nombre,
          detalle: `${p.unidades} u.${verCostos ? ` · ganancia ${formatearPrecio(p.ganancia)}` : ""}`,
          monto: p.monto,
        }))}
      />
      <Tabla titulo="Gastos por categoría" filas={porCategoria.results} />
      <Tabla
        titulo="Por día"
        filas={porDia.results.map((d) => ({ nombre: d.dia, detalle: `${d.ventas} ventas`, monto: d.monto }))}
      />

      {lista.results.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm print:shadow-none">
          <h2 className="mb-2 text-[13px] font-extrabold">Ventas del período</h2>
          <ul>
            {lista.results.map((venta) => (
              <li key={venta.id} className="border-b border-linea last:border-0">
                <Link href={`/panel/vender/${venta.id}`} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1 text-[12px]">
                    <span className="block font-bold">
                      #{venta.id} · {venta.cliente ?? "Sin cliente"}
                    </span>
                    <span className="block text-gris">
                      {horaLocal(venta.fecha, minutos)} · {NOMBRE_METODO[venta.metodo_pago] ?? venta.metodo_pago}
                      {venta.vendedor ? ` · ${venta.vendedor}` : " · tienda"}
                    </span>
                  </span>
                  <span className="text-[12.5px] font-black">{formatearPrecio(venta.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
