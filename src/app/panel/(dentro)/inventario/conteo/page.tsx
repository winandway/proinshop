import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { GuardaBorrador, LimpiarBorrador } from "@/componentes/GuardaBorrador";
import { exigir, puede } from "@/lib/sesion";
import { horaLocal, minutosZona } from "@/lib/zona";
import { aplicarConteo } from "./acciones";

export const metadata: Metadata = { title: "Conteo de inventario", robots: { index: false } };

/**
 * Conteo de inventario, como en Treinta: se recorre la bodega, se escribe
 * cuántas unidades hay de verdad y el sistema ajusta el stock y dice cuánto
 * vale lo que faltaba o sobraba. Lo escrito se guarda solo mientras se cuenta.
 */
export default async function Conteo({ searchParams }: { searchParams: Promise<{ hecho?: string }> }) {
  const usuario = await exigir("conteo");
  const verCostos = puede(usuario, "costos");
  const { hecho } = await searchParams;
  const db = await baseDeDatos();
  const minutos = await minutosZona();

  const [productos, variantes] = db
    ? await Promise.all([
        db
          .prepare(
            `SELECT p.id, p.nombre_es, p.stock, c.nombre_es AS categoria
             FROM producto p LEFT JOIN categoria c ON c.id = p.categoria_id
             WHERE COALESCE(p.es_servicio, 0) = 0
             ORDER BY c.orden, c.nombre_es, p.nombre_es`,
          )
          .all<{ id: number; nombre_es: string; stock: number; categoria: string | null }>()
          .then((r) => r.results),
        db
          .prepare("SELECT id, producto_id, nombre_es, stock FROM variante ORDER BY id")
          .all<{ id: number; producto_id: number; nombre_es: string; stock: number }>()
          .then((r) => r.results),
      ])
    : [[], []];

  const resultado =
    db && hecho
      ? await db
          .prepare("SELECT * FROM conteo WHERE id = ?")
          .bind(Number(hecho))
          .first<{ id: number; fecha: string; productos: number; diferencias: number; valor_diferencia: number }>()
      : null;
  const cambios =
    db && hecho
      ? (
          await db
            .prepare(
              `SELECT p.nombre_es, m.cantidad, m.stock_final FROM movimiento_inventario m
               JOIN producto p ON p.id = m.producto_id
               WHERE m.referencia = ? ORDER BY m.id`,
            )
            .bind(`Conteo #${Number(hecho)}`)
            .all<{ nombre_es: string; cantidad: number; stock_final: number }>()
        ).results
      : [];

  const historial = db
    ? (
        await db
          .prepare(
            `SELECT c.id, c.fecha, c.productos, c.diferencias, c.valor_diferencia, u.nombre AS usuario
             FROM conteo c LEFT JOIN usuario u ON u.id = c.usuario_id ORDER BY c.id DESC LIMIT 10`,
          )
          .all<{ id: number; fecha: string; productos: number; diferencias: number; valor_diferencia: number; usuario: string | null }>()
      ).results
    : [];

  // Agrupados por categoría, como en la bodega.
  const grupos: { categoria: string; productos: typeof productos }[] = [];
  for (const producto of productos) {
    const nombre = producto.categoria ?? "Sin categoría";
    const grupo = grupos.find((g) => g.categoria === nombre);
    if (grupo) grupo.productos.push(producto);
    else grupos.push({ categoria: nombre, productos: [producto] });
  }

  return (
    <div className="pb-28">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/inventario"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="text-lg font-black tracking-tight">Conteo de inventario</h1>
      </div>

      {resultado && (
        <>
          <LimpiarBorrador claves={["conteo"]} />
          <div className="mb-4 rounded-2xl border border-verde bg-verde-suave p-4">
            <p className="text-[13px] font-extrabold text-[#0b6e3a]">Conteo aplicado</p>
            <p className="mt-1 text-[12.5px] text-[#3d6b52]">
              {resultado.productos} contados · {resultado.diferencias} con diferencia
              {verCostos && ` · ${formatearPrecio(resultado.valor_diferencia)}`}
            </p>
            {cambios.length > 0 && (
              <ul className="mt-2 space-y-1">
                {cambios.map((cambio, indice) => (
                  <li key={indice} className="flex justify-between text-[12px] text-[#3d6b52]">
                    <span>{cambio.nombre_es}</span>
                    <span className="font-bold">
                      {cambio.cantidad > 0 ? "+" : ""}
                      {cambio.cantidad} → {cambio.stock_final}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <p className="mb-3 text-[12.5px] text-gris">
        Escribe cuántas unidades hay de verdad. Deja vacío lo que no contaste: no se toca.
      </p>

      <form action={aplicarConteo}>
        <GuardaBorrador clave="conteo" />
        <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {grupos.map((grupo) => (
            <li key={grupo.categoria}>
              <p className="bg-crema px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-gris">
                {grupo.categoria}
              </p>
              <ul>
                {grupo.productos.map((producto) => {
                  const suyas = variantes.filter((v) => v.producto_id === producto.id);
                  const filas =
                    suyas.length === 0
                      ? [{ clave: `p${producto.id}`, nombre: producto.nombre_es, stock: producto.stock, campo: `contado_${producto.id}` }]
                      : suyas.map((v) => ({
                          clave: `v${v.id}`,
                          nombre: `${producto.nombre_es} · ${v.nombre_es}`,
                          stock: v.stock,
                          campo: `contado_v_${v.id}`,
                        }));
                  return filas.map((fila) => (
                    <li
                      key={fila.clave}
                      className="flex items-center gap-3 border-b border-linea px-4 py-2.5 last:border-0"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold">{fila.nombre}</span>
                        <span className="block text-[11px] text-gris">Registrado: {fila.stock}</span>
                      </span>
                      <input
                        name={fila.campo}
                        inputMode="numeric"
                        placeholder="—"
                        aria-label={`Contado de ${fila.nombre}`}
                        className="w-20 rounded-xl border-[1.5px] border-linea px-3 py-2 text-center text-[13px] font-bold outline-none focus:border-rojo"
                      />
                    </li>
                  ));
                })}
              </ul>
            </li>
          ))}
        </ul>

        <input
          name="nota"
          placeholder="Nota del conteo (opcional)"
          aria-label="Nota del conteo"
          className="mt-3 w-full rounded-xl border-[1.5px] border-linea bg-white px-4 py-3 text-[13px] font-semibold outline-none placeholder:font-normal placeholder:text-gris2"
        />

        <div className="fixed inset-x-0 bottom-[74px] z-30 border-t border-linea bg-white p-3.5 md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-14rem)] md:max-w-3xl">
          <button
            type="submit"
            className="w-full rounded-2xl bg-rojo py-3.5 text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
          >
            Aplicar conteo
          </button>
        </div>
      </form>

      {historial.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-[13px] font-extrabold">Conteos anteriores</h2>
          <ul className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {historial.map((fila) => (
              <li key={fila.id} className="border-b border-linea px-4 py-3 text-[12.5px] last:border-0">
                <Link href={`/panel/inventario/conteo?hecho=${fila.id}`} className="flex justify-between">
                  <span className="font-bold">{horaLocal(fila.fecha, minutos)}</span>
                  <span className="text-gris">
                    {fila.productos} contados · {fila.diferencias} diferencias
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
