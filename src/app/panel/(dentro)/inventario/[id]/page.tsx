import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FormularioProducto } from "@/componentes/panel/FormularioProducto";
import { BotonCopiar } from "@/componentes/panel/BotonCopiar";
import { baseDeDatos } from "@/lib/d1";
import { NEGOCIO } from "@/lib/config";
import { actualizarProducto } from "../acciones";

export const metadata: Metadata = { title: "Producto", robots: { index: false } };

export default async function EditarProducto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;

  const db = await baseDeDatos();
  if (!db) notFound();

  const producto = await db
    .prepare(
      `SELECT p.*, (SELECT clave_r2_web FROM foto WHERE producto_id = p.id ORDER BY orden LIMIT 1) AS foto
       FROM producto p WHERE p.id = ?`,
    )
    .bind(Number(id))
    .first<{
      id: number;
      slug: string;
      nombre_es: string;
      nombre_en: string | null;
      descripcion_es: string | null;
      sku: string | null;
      codigo_barras: string | null;
      costo: number;
      precio: number;
      stock: number;
      publicado: number;
      categoria_id: number | null;
      foto: string | null;
    }>();

  if (!producto) notFound();

  const categorias = (
    await db
      .prepare("SELECT id, nombre_es FROM categoria WHERE visible = 1 ORDER BY orden")
      .all<{ id: number; nombre_es: string }>()
  ).results;

  const movimientos = (
    await db
      .prepare(
        `SELECT fecha, motivo, cantidad, stock_final, nota
         FROM movimiento_inventario WHERE producto_id = ?
         ORDER BY id DESC LIMIT 8`,
      )
      .bind(producto.id)
      .all<{
        fecha: string;
        motivo: string;
        cantidad: number;
        stock_final: number;
        nota: string | null;
      }>()
  ).results;

  const enlace = `${NEGOCIO.url}/producto/${producto.slug}`;

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/panel/inventario"
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm"
        >
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-black tracking-tight">
          {producto.nombre_es}
        </h1>
      </div>

      {nuevo && (
        <div className="mb-3 rounded-2xl border border-verde bg-verde-suave p-4">
          <p className="text-[14px] font-extrabold text-[#0b6e3a]">🎉 ¡Producto creado!</p>
          <p className="mt-1 text-[12.5px] text-[#3d6b52]">
            {producto.publicado === 1
              ? "Ya está visible en tu tienda."
              : "Quedó guardado, pero sin publicar en la tienda."}
          </p>
          {producto.publicado === 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <BotonCopiar
                texto={enlace}
                etiqueta="Copiar enlace"
                className="rounded-lg bg-tinta px-3 py-1.5 text-[11.5px] font-bold text-white transition hover:opacity-90"
              />
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${producto.nombre_es} — ${enlace}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11.5px] font-bold text-verde hover:underline"
              >
                Compartir por WhatsApp
              </a>
              <a
                href={enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11.5px] font-bold text-gris hover:underline"
              >
                Ver en la tienda ↗
              </a>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <FormularioProducto
          accion={actualizarProducto}
          categorias={categorias.map((c) => ({ id: c.id, nombre: c.nombre_es }))}
          boton="Guardar cambios"
          producto={{
            id: producto.id,
            nombre: producto.nombre_es,
            nombreIngles: producto.nombre_en ?? "",
            descripcion: producto.descripcion_es ?? "",
            sku: producto.sku ?? "",
            codigoBarras: producto.codigo_barras ?? "",
            costo: producto.costo,
            precio: producto.precio,
            stock: producto.stock,
            categoriaId: producto.categoria_id,
            publicado: producto.publicado === 1,
            foto: producto.foto,
          }}
        />
      </div>

      {movimientos.length > 0 && (
        <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[13px] font-extrabold">Historial de stock</h2>
          <ul className="space-y-2.5">
            {movimientos.map((movimiento, indice) => (
              <li
                key={`${movimiento.fecha}-${indice}`}
                className="flex items-center gap-3 border-b border-linea pb-2.5 text-[12.5px] last:border-0 last:pb-0"
              >
                <span
                  className={`font-extrabold ${
                    movimiento.cantidad > 0 ? "text-verde" : "text-rojo"
                  }`}
                >
                  {movimiento.cantidad > 0 ? "+" : ""}
                  {movimiento.cantidad}
                </span>
                <span className="flex-1">
                  <span className="block font-bold capitalize">{movimiento.motivo}</span>
                  <span className="block text-[11px] text-gris">
                    {movimiento.fecha.slice(0, 16).replace("T", " ")}
                    {movimiento.nota ? ` · ${movimiento.nota}` : ""}
                  </span>
                </span>
                <span className="text-[11.5px] text-gris">quedó en {movimiento.stock_final}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
