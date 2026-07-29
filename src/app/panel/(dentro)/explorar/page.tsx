import Link from "next/link";
import type { Metadata } from "next";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Explorar", robots: { index: false } };

const SECCIONES = [
  {
    titulo: "Tu negocio",
    enlaces: [
      { href: "/panel/inventario", icono: "📦", texto: "Inventario" },
      { href: "/panel/pedidos", icono: "🛒", texto: "Pedidos de la tienda" },
      { href: "/panel/estadisticas", icono: "📊", texto: "Estadísticas" },
      { href: "/panel/balance", icono: "💵", texto: "Balance y reportes" },
    ],
  },
  {
    titulo: "Personas",
    enlaces: [
      { href: "/panel/clientes", icono: "👥", texto: "Clientes" },
      { href: "/panel/deudas", icono: "💰", texto: "Cuentas por cobrar" },
      { href: "/panel/cotizaciones", icono: "📄", texto: "Cotizaciones" },
      { href: "/panel/proveedores", icono: "🚚", texto: "Proveedores" },
    ],
  },
  {
    titulo: "Configuración",
    soloDueno: true,
    enlaces: [
      { href: "/panel/tienda", icono: "🏪", texto: "Mi tienda" },
      { href: "/panel/equipo", icono: "🧑‍🤝‍🧑", texto: "Equipo" },
      { href: "/panel/cuenta", icono: "⚙️", texto: "Mi cuenta" },
    ],
  },
];

export default async function Explorar() {
  const usuario = await usuarioActual();

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Explorar</h1>

      {SECCIONES.map((seccion) => {
        const enlaces =
          seccion.soloDueno && usuario?.rol !== "dueno"
            ? seccion.enlaces.filter((enlace) => enlace.href === "/panel/cuenta")
            : seccion.enlaces;

        return (
          <section key={seccion.titulo} className="mb-4">
            <h2 className="mb-2 text-[13px] font-extrabold">{seccion.titulo}</h2>
            <div className="overflow-hidden rounded-2xl border border-linea bg-white">
              {enlaces.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className="flex items-center gap-3 border-b border-linea px-4 py-3.5 transition last:border-0 hover:bg-crema"
                >
                  <span aria-hidden="true" className="text-lg">
                    {enlace.icono}
                  </span>
                  <span className="flex-1 text-[13.5px] font-bold">{enlace.texto}</span>
                  <span aria-hidden="true" className="text-gris2">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <a
        href="/guia"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl border border-linea bg-white p-4 text-center text-[13px] font-bold transition hover:bg-crema"
      >
        📖 Ver el manual de la app
      </a>
    </>
  );
}
