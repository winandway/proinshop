import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { estaPorAgotarse } from "@/lib/inventario";
import { datosNegocio } from "@/lib/negocio";
import { puede, usuarioActual } from "@/lib/sesion";
import { alternarPublicado } from "./acciones";

export const metadata: Metadata = { title: "Inventario", robots: { index: false } };

type FilaInventario = {
  id: number;
  nombre_es: string;
  precio: number;
  costo: number;
  stock: number;
  stock_minimo: number;
  es_servicio: number;
  publicado: number;
  emoji: string | null;
  categoria: string | null;
  foto: string | null;
  vendidos: number;
};

const ORDENES = {
  recientes: { texto: "Más recientes", sql: "p.id DESC" },
  vendidos: { texto: "Más vendidos", sql: "vendidos DESC, p.id DESC" },
  stock: { texto: "Menos stock", sql: "COALESCE(p.es_servicio, 0) ASC, p.stock ASC, p.nombre_es" },
  nombre: { texto: "Nombre", sql: "p.nombre_es COLLATE NOCASE" },
} as const;

type Orden = keyof typeof ORDENES;

export default async function Inventario({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    eliminado?: string;
    filtro?: string;
    orden?: string;
    importados?: string;
    masivo?: string;
    borrados?: string;
  }>;
}) {
  const { q, categoria, eliminado, filtro, orden, importados, masivo, borrados } = await searchParams;
  const usuario = await usuarioActual();
  // Cada quien ve lo que su permiso le deja: el vendedor consulta precios y
  // existencias; los costos y el valor del inventario son de quien ve costos.
  const verCostos = puede(usuario, "costos");
  const verReportes = puede(usuario, "reportes");
  const editaCatalogo = puede(usuario, "inventario");
  const db = await baseDeDatos();
  const negocio = await datosNegocio();
  const umbral = negocio.umbralStock;
  const elegido: Orden = orden && orden in ORDENES ? (orden as Orden) : "recientes";

  const resumen = db
    ? await db
        .prepare(
          `SELECT COUNT(*) AS referencias,
                  COALESCE(SUM(CASE WHEN COALESCE(es_servicio, 0) = 0 THEN costo * stock ELSE 0 END), 0) AS costo_total,
                  COALESCE(SUM(CASE WHEN COALESCE(es_servicio, 0) = 0 THEN precio * stock ELSE 0 END), 0) AS valor_venta,
                  SUM(CASE WHEN COALESCE(es_servicio, 0) = 0
                            AND stock <= CASE WHEN stock_minimo > 0 THEN stock_minimo ELSE ? END
                           THEN 1 ELSE 0 END) AS por_agotarse
           FROM producto`,
        )
        .bind(umbral)
        .first<{ referencias: number; costo_total: number; valor_venta: number; por_agotarse: number }>()
    : null;

  const categorias = db
    ? (
        await db
          .prepare("SELECT id, nombre_es FROM categoria WHERE visible = 1 ORDER BY orden")
          .all<{ id: number; nombre_es: string }>()
      ).results
    : [];

  const condiciones: string[] = [];
  const valores: (string | number)[] = [];
  if (categoria) {
    condiciones.push("p.categoria_id = ?");
    valores.push(Number(categoria));
  }
  if (q) {
    condiciones.push("(lower(p.nombre_es) LIKE ? OR lower(p.sku) LIKE ? OR p.codigo_barras = ?)");
    valores.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, q);
  }
  if (filtro === "bajo") {
    condiciones.push(
      "COALESCE(p.es_servicio, 0) = 0 AND p.stock <= CASE WHEN p.stock_minimo > 0 THEN p.stock_minimo ELSE ? END",
    );
    valores.push(umbral);
  }

  const productos = db
    ? (
        await db
          .prepare(
            `SELECT p.id, p.nombre_es, p.precio, p.costo, p.stock, p.stock_minimo,
                    COALESCE(p.es_servicio, 0) AS es_servicio, p.publicado, p.emoji,
                    c.nombre_es AS categoria,
                    (SELECT clave_r2_web FROM foto WHERE producto_id = p.id ORDER BY orden, id DESC LIMIT 1) AS foto,
                    (SELECT COALESCE(SUM(vi.cantidad), 0) FROM venta_item vi JOIN venta v ON v.id = vi.venta_id
                     WHERE vi.producto_id = p.id AND COALESCE(v.anulada, 0) = 0) AS vendidos
             FROM producto p LEFT JOIN categoria c ON c.id = p.categoria_id
             ${condiciones.length ? "WHERE " + condiciones.join(" AND ") : ""}
             ORDER BY ${ORDENES[elegido].sql}
             LIMIT 500`,
          )
          .bind(...valores)
          .all<FilaInventario>()
      ).results
    : [];

  const enlace = (cambios: Record<string, string | undefined>) => {
    const parametros = new URLSearchParams();
    const todo = { q, categoria, filtro, orden, ...cambios };
    for (const [clave, valor] of Object.entries(todo)) if (valor) parametros.set(clave, valor);
    const texto = parametros.toString();
    return `/panel/inventario${texto ? `?${texto}` : ""}`;
  };

  return (
    <div className={editaCatalogo ? "pb-36" : "pb-6"}>
      {eliminado && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          Producto eliminado. Ya no aparece en la tienda.
        </p>
      )}
      {importados && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          Listo: se cargaron {importados} productos desde el archivo.
        </p>
      )}
      {masivo && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          Cambios aplicados a {masivo} productos.
        </p>
      )}
      {borrados && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-verde bg-verde-suave px-3.5 py-2.5 text-[12.5px] font-bold text-verde"
        >
          Se borraron {borrados} productos. Ya no aparecen en la tienda.
        </p>
      )}

      {verReportes && (
        <Link
          href="/panel/reportes"
          className="mb-3 block rounded-xl border-[1.5px] border-linea bg-white py-3 text-center text-[13.5px] font-bold transition hover:border-gris2"
        >
          🧾 Reportes
        </Link>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Total de referencias</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">{resumen?.referencias ?? 0}</p>
        </div>
        <Link
          href={enlace({ filtro: filtro === "bajo" ? undefined : "bajo" })}
          className={`rounded-2xl p-3 shadow-sm transition ${
            filtro === "bajo" ? "bg-rojo-suave ring-2 ring-rojo" : "bg-white hover:shadow-md"
          }`}
        >
          <p className="text-[11px] font-semibold text-gris">⚠️ Por agotarse</p>
          <p
            className={`mt-0.5 text-xl font-black tracking-tight ${
              (resumen?.por_agotarse ?? 0) > 0 ? "text-rojo-oscuro" : ""
            }`}
          >
            {resumen?.por_agotarse ?? 0}
          </p>
        </Link>
        {verCostos && (
          <>
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-gris">Costo total</p>
              <p className="mt-0.5 text-xl font-black tracking-tight">
                {formatearPrecio(resumen?.costo_total ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-gris">Valor de venta</p>
              <p className="mt-0.5 text-xl font-black tracking-tight">
                {formatearPrecio(resumen?.valor_venta ?? 0)}
              </p>
            </div>
          </>
        )}
      </div>

      <form className="mb-3 flex gap-2">
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        {filtro && <input type="hidden" name="filtro" value={filtro} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar producto, SKU o código de barras"
          aria-label="Buscar producto"
          className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-[13px] shadow-sm outline-none placeholder:text-gris2"
        />
        <select
          name="orden"
          defaultValue={elegido}
          aria-label="Ordenar"
          className="w-36 rounded-xl bg-white px-3 text-[12.5px] font-semibold shadow-sm outline-none"
        >
          {Object.entries(ORDENES).map(([clave, opcion]) => (
            <option key={clave} value={clave}>
              {opcion.texto}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-tinta px-3 text-[12px] font-bold text-white">
          Ir
        </button>
      </form>

      <div className="sin-barra mb-3 flex gap-2 overflow-x-auto">
        <Link
          href={enlace({ categoria: undefined })}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
            !categoria ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-gris"
          }`}
        >
          Todas las categorías
        </Link>
        {categorias.map((c) => (
          <Link
            key={c.id}
            href={enlace({ categoria: String(c.id) })}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
              Number(categoria) === c.id
                ? "border-tinta bg-tinta text-white"
                : "border-linea bg-white text-gris"
            }`}
          >
            {c.nombre_es}
          </Link>
        ))}
      </div>

      {editaCatalogo && (
        <div className="sin-barra mb-3 flex gap-2 overflow-x-auto">
          {[
            { href: "/panel/inventario/conteo", texto: "📋 Conteo de inventario", permiso: puede(usuario, "conteo") },
            { href: "/panel/inventario/masivo", texto: "✏️ Edición masiva", permiso: true },
            { href: "/panel/inventario/importar", texto: "📥 Cargar desde Excel", permiso: true },
            { href: "/panel/inventario/exportar", texto: "📤 Descargar Excel", permiso: true },
            { href: "/panel/compras/nueva", texto: "🚚 Registrar compra", permiso: puede(usuario, "compras") },
          ]
            .filter((accion) => accion.permiso)
            .map((accion) =>
              accion.href.endsWith("exportar") ? (
                <a
                  key={accion.href}
                  href={accion.href}
                  download
                  className="whitespace-nowrap rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-2 text-[12px] font-bold transition hover:border-gris2"
                >
                  {accion.texto}
                </a>
              ) : (
                <Link
                  key={accion.href}
                  href={accion.href}
                  className="whitespace-nowrap rounded-xl border-[1.5px] border-linea bg-white px-3.5 py-2 text-[12px] font-bold transition hover:border-gris2"
                >
                  {accion.texto}
                </Link>
              ),
            )}
        </div>
      )}

      {productos.length === 0 ? (
        <p className="rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          {filtro === "bajo"
            ? "Ningún producto está por agotarse. 👌"
            : q || categoria
              ? "No hay productos con ese filtro."
              : editaCatalogo
                ? "Todavía no hay productos. Carga el primero con el botón de abajo."
                : "Todavía no hay productos cargados."}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {productos.map((producto) => {
            const bajo = estaPorAgotarse(
              producto.stock,
              producto.stock_minimo,
              umbral,
              producto.es_servicio === 1,
            );
            return (
              <li key={producto.id} className="rounded-2xl bg-white shadow-sm">
                <Link
                  href={editaCatalogo ? `/panel/inventario/${producto.id}` : "#"}
                  aria-disabled={!editaCatalogo}
                  className={`flex items-center gap-3 p-3 transition ${
                    editaCatalogo ? "hover:opacity-80" : "pointer-events-none"
                  }`}
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-crema text-2xl">
                    {producto.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element -- viene de R2 por CDN
                      <img src={`/media/${producto.foto}`} alt="" className="h-full w-full object-contain" />
                    ) : (
                      (producto.emoji ?? "📦")
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold">{producto.nombre_es}</p>
                    <p className="text-[12px] text-gris">
                      {formatearPrecio(producto.precio)}
                      {verCostos && producto.costo > 0 && ` · Costo ${formatearPrecio(producto.costo)}`}
                      {producto.vendidos > 0 && ` · ${producto.vendidos} vendidos`}
                    </p>
                    <p
                      className={`mt-0.5 text-[13.5px] font-extrabold ${
                        producto.es_servicio
                          ? ""
                          : producto.stock <= 0
                            ? "text-rojo-oscuro"
                            : bajo
                              ? "text-ambar"
                              : ""
                      }`}
                    >
                      {producto.es_servicio
                        ? "Servicio"
                        : producto.stock <= 0
                          ? "Agotado"
                          : `${producto.stock} disponibles${bajo ? " · por agotarse" : ""}`}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[9.5px] font-extrabold ${
                        producto.publicado === 1 ? "bg-verde-suave text-verde" : "bg-crema text-gris"
                      }`}
                    >
                      {producto.publicado === 1 ? "● En la tienda" : "○ Sin publicar"}
                    </span>
                  </div>
                </Link>

                {/* Publicar o esconder sin entrar a editar: es lo que más se usa. */}
                {editaCatalogo && (
                  <form action={alternarPublicado} className="mt-1.5 px-3 pb-1">
                    <input type="hidden" name="id" value={producto.id} />
                    <button
                      type="submit"
                      className="text-[11px] font-bold text-gris transition hover:text-rojo"
                    >
                      {producto.publicado === 1 ? "Quitar de la tienda" : "Publicar en la tienda"}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editaCatalogo && (
        <div className="fixed inset-x-0 bottom-[74px] z-30 border-t border-linea bg-white p-3.5 md:bottom-0 md:left-auto md:right-0 md:w-[calc(100%-14rem)] md:max-w-3xl">
          <Link
            href="/panel/inventario/nuevo"
            className="block rounded-xl bg-tinta py-3.5 text-center text-sm font-extrabold text-white transition hover:opacity-90"
          >
            ＋ Crear producto
          </Link>
          <Link
            href="/panel/inventario/categorias"
            className="mt-2 block rounded-xl border-[1.5px] border-linea py-3.5 text-center text-sm font-extrabold transition hover:border-gris2"
          >
            ⊞ Categorías
          </Link>
        </div>
      )}
    </div>
  );
}
