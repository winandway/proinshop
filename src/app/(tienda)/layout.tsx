import { Encabezado } from "@/componentes/Encabezado";
import { PieDePagina } from "@/componentes/PieDePagina";
import { ProveedorCarrito } from "@/componentes/carrito";

/**
 * Marco de la tienda pública. El panel de administración cuelga fuera de este
 * grupo, así que no arrastra el encabezado con carrito ni el pie de la tienda.
 */
export default function DisenoTienda({ children }: { children: React.ReactNode }) {
  return (
    <ProveedorCarrito>
      <Encabezado />
      <main className="flex-1">{children}</main>
      <PieDePagina />
    </ProveedorCarrito>
  );
}
