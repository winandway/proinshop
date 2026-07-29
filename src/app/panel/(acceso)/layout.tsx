import Link from "next/link";
import { Diana } from "@/componentes/Logo";

/** Marco de las pantallas de acceso: sin encabezado de tienda ni carrito. */
export default function DisenoAcceso({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-crema">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-7 flex items-center justify-center gap-2.5">
            <Diana className="h-9 w-9 text-rojo" />
            <span className="text-xl font-black tracking-tight">PROINSHOP</span>
          </Link>

          <div className="rounded-3xl bg-white p-7 shadow-[0_2px_20px_rgba(16,20,30,0.07)]">
            {children}
          </div>

          <p className="mt-6 text-center text-[11.5px] text-gris2">
            © {new Date().getFullYear()} proinshop.com · Panel de administración
          </p>
        </div>
      </div>
    </div>
  );
}
