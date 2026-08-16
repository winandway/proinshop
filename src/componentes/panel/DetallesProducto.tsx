import { formatearPrecio } from "@/lib/i18n";
import {
  agregarEspecificacion,
  agregarVariante,
  quitarEspecificacion,
  quitarVariante,
} from "@/app/panel/(dentro)/inventario/[id]/detalles";

const CAMPO =
  "w-full rounded-xl border-[1.5px] border-linea px-3 py-2.5 text-[12.5px] font-semibold outline-none transition placeholder:font-normal placeholder:text-gris2 focus:border-rojo";

export type VarianteFila = {
  id: number;
  nombre_es: string;
  nombre_en: string | null;
  stock: number;
  precio_extra: number;
};

export type EspecificacionFila = {
  id: number;
  etiqueta_es: string;
  valor_es: string;
};

/** Variantes (color, talla, potencia) y ficha técnica del producto. */
export function DetallesProducto({
  productoId,
  variantes,
  especificaciones,
}: {
  productoId: number;
  variantes: VarianteFila[];
  especificaciones: EspecificacionFila[];
}) {
  return (
    <>
      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-[13px] font-extrabold">Variantes</h2>
        <p className="mb-3 mt-1 text-[11.5px] text-gris">
          El mismo producto en otro color, talla o potencia. Cada una lleva su
          propio stock.
        </p>

        {variantes.length > 0 && (
          <ul className="mb-3 space-y-2">
            {variantes.map((variante) => (
              <li
                key={variante.id}
                className="flex items-center gap-3 rounded-xl bg-crema px-3 py-2.5 text-[12.5px]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{variante.nombre_es}</span>
                  <span className="block text-[11px] text-gris">
                    {variante.stock} disponibles
                    {variante.precio_extra !== 0 &&
                      ` · ${variante.precio_extra > 0 ? "+" : ""}${formatearPrecio(variante.precio_extra)}`}
                  </span>
                </span>
                <form action={quitarVariante}>
                  <input type="hidden" name="id" value={variante.id} />
                  <input type="hidden" name="producto_id" value={productoId} />
                  <button
                    type="submit"
                    className="text-[11px] font-bold text-gris transition hover:text-rojo"
                  >
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={agregarVariante} className="space-y-2">
          <input type="hidden" name="producto_id" value={productoId} />
          <div className="flex gap-2">
            <input name="nombre" required placeholder="Rojo, Talla M, 5 kW…" className={CAMPO} />
            <input name="nombre_en" placeholder="En inglés" className={CAMPO} />
          </div>
          <div className="flex gap-2">
            <input
              name="stock"
              type="number"
              min="0"
              placeholder="Cantidad"
              className={CAMPO}
            />
            <input
              name="precio_extra"
              inputMode="decimal"
              placeholder="Suma al precio"
              className={CAMPO}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-tinta py-2.5 text-[12.5px] font-extrabold text-white transition hover:opacity-90"
          >
            ＋ Agregar variante
          </button>
        </form>
      </div>

      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-[13px] font-extrabold">Especificaciones</h2>
        <p className="mb-3 mt-1 text-[11.5px] text-gris">
          La ficha técnica que ve el cliente: potencia, voltaje, garantía…
        </p>

        {especificaciones.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {especificaciones.map((fila) => (
              <li
                key={fila.id}
                className="flex items-center gap-3 border-b border-linea pb-1.5 text-[12.5px] last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="text-gris">{fila.etiqueta_es}: </span>
                  <span className="font-bold">{fila.valor_es}</span>
                </span>
                <form action={quitarEspecificacion}>
                  <input type="hidden" name="id" value={fila.id} />
                  <input type="hidden" name="producto_id" value={productoId} />
                  <button
                    type="submit"
                    className="text-[11px] font-bold text-gris transition hover:text-rojo"
                  >
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={agregarEspecificacion} className="space-y-2">
          <input type="hidden" name="producto_id" value={productoId} />
          <div className="flex gap-2">
            <input name="etiqueta" required placeholder="Potencia" className={CAMPO} />
            <input name="valor" required placeholder="3.5 kW" className={CAMPO} />
          </div>
          <div className="flex gap-2">
            <input name="etiqueta_en" placeholder="Power (inglés)" className={CAMPO} />
            <input name="valor_en" placeholder="3.5 kW (inglés)" className={CAMPO} />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-tinta py-2.5 text-[12.5px] font-extrabold text-white transition hover:opacity-90"
          >
            ＋ Agregar especificación
          </button>
        </form>
      </div>
    </>
  );
}
