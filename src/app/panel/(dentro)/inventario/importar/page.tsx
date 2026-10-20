import Link from "next/link";
import type { Metadata } from "next";
import { FormularioImportar } from "@/componentes/panel/FormularioImportar";
import { exigir } from "@/lib/sesion";

export const metadata: Metadata = { title: "Cargar desde Excel", robots: { index: false } };

export default async function Importar() {
  await exigir("inventario");
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
        <h1 className="text-lg font-black tracking-tight">Cargar productos desde Excel</h1>
      </div>

      <ol className="mb-4 space-y-2 rounded-2xl bg-white p-4 text-[12.5px] text-gris shadow-sm">
        <li>
          <b className="text-tinta">1.</b> Baja la plantilla, o descarga tu inventario actual para
          cambiar precios y existencias de muchos productos a la vez.
        </li>
        <li>
          <b className="text-tinta">2.</b> Llénala en Excel o en Google Sheets. Lo único obligatorio es
          el nombre y el precio.
        </li>
        <li>
          <b className="text-tinta">3.</b> Guárdala como <b className="text-tinta">CSV UTF-8</b> y súbela
          aquí. Si el renglón trae el id, el código de barras o el SKU de un producto que ya existe, se
          actualiza; si no, se crea.
        </li>
      </ol>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <a
          href="/panel/inventario/exportar?plantilla=1"
          download
          className="rounded-xl border-[1.5px] border-linea bg-white py-3 text-center text-[12.5px] font-bold transition hover:border-gris2"
        >
          📄 Bajar plantilla
        </a>
        <a
          href="/panel/inventario/exportar"
          download
          className="rounded-xl border-[1.5px] border-linea bg-white py-3 text-center text-[12.5px] font-bold transition hover:border-gris2"
        >
          📤 Bajar mi inventario
        </a>
      </div>

      <FormularioImportar />
    </>
  );
}
