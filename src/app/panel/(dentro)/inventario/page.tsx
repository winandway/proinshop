import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";

export const metadata: Metadata = { title: "Inventario", robots: { index: false } };

type FilaInventario = {
  id: number;
  nombre_es: string;
  precio: number;
  costo: number;
  stock: number;
  publicado: number;
  emoji: string | null;
  categoria: string | null;
  foto: string | null;
};

export default async function Inventario({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q, categoria } = await searchParams;
  const db = await baseDeDatos();

  const resumen = db
    ? await db
        .prepare(
          `SELECT COUNT(*) AS referencias, COALESCE(SUM(costo * stock), 0) AS costo_total
           FROM producto`,
        )
        .first<{ referencias: number; costo_total: number }>()
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

  const productos = db
    ? (
        await db
          .prepare(
            `SELECT p.id, p.nombre_es, p.precio, p.costo, p.stock, p.publicado, p.emoji,
                    c.nombre_es AS categoria,
                    (SELECT clave_r2_web FROM foto WHERE producto_id = p.id ORDER BY orden LIMIT 1) AS foto
             FROM producto p LEFT JOIN categoria c ON c.id = p.categoria_id
             ${condiciones.length ? "WHERE " + condiciones.join(" AND ") : ""}
             ORDER BY p.id DESC`,
          )
          .bind(...valores)
          .all<FilaInventario>()
      ).results
    : [];

  return (
    <div className="pb-36">
      <Link
        href="/panel/balance"
        className="mb-3 block rounded-xl border-[1.5px] border-linea bg-white py-3 text-center text-[13.5px] font-bold transition hover:border-gris2"
      >
        🧾 Reportes
      </Link>

      <div className="mb-3 flex gap-2.5">
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Total de referencias</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">{resumen?.referencias ?? 0}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gris">Costo total</p>
          <p className="mt-0.5 text-xl font-black tracking-tight">
            {formatearPrecio(resumen?.costo_total ?? 0)}
          </p>
        </div>
      </div>

      <form className="mb-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar producto, SKU o código de barras"
          className="w-full rounded-xl bg-white px-4 py-3 text-[13px] shadow-sm outline-none placeholder:text-gris2"
        />
      </form>

      <div className="sin-barra mb-3 flex gap-2 overflow-x-auto">
        <Link
          href="/panel/inventario"
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${
            !categoria ? "border-tinta bg-tinta text-white" : "border-linea bg-white text-gris"
          }`}
        >
          Todas las categorías
        </Link>
        {categorias.map((c) => (
          <Link
            key={c.id}
            href={`/panel/inventario?categoria=${c.id}`}
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

      {productos.length === 0 ? (
        <p className="rounded-2xl border border-linea bg-white p-6 text-center text-[13px] text-gris">
          {q || categoria
            ? "No hay productos con ese filtro."
            : "Todavía no hay productos. Carga el primero con el botón de abajo."}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {productos.map((producto) => (
            <li key={producto.id}>
              <Link
                href={`/panel/inventario/${producto.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-crema text-2xl">
                  {producto.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- viene de R2 por CDN
                    <img
                      src={`/media/${producto.foto}`}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    (producto.emoji ?? "📦")
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-extrabold">{producto.nombre_es}</p>
                  <p className="text-[12px] text-gris">
                    {formatearPrecio(producto.precio)}
                    {producto.costo > 0 && ` · Costo ${formatearPrecio(producto.costo)}`}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-extrabold">
                    {producto.stock} disponibles
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[9.5px] font-extrabold ${
                      producto.publicado === 1
                        ? "bg-verde-suave text-verde"
                        : "bg-crema text-gris"
                    }`}
                  >
                    {producto.publicado === 1 ? "● En la tienda" : "○ Sin publicar"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

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
    </div>
  );
}
