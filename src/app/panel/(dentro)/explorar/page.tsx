import Link from "next/link";
import type { Metadata } from "next";
import { puede, usuarioActual, type UsuarioSesion } from "@/lib/sesion";
import { esCuentaDeSoporte } from "@/lib/contrasenas";

export const metadata: Metadata = { title: "Explorar", robots: { index: false } };

type Enlace = {
  href: string;
  icono: string;
  texto: string;
  /** Quién lo ve. Sin regla: todos. */
  ver?: (usuario: UsuarioSesion) => boolean;
};

const esDueno = (u: UsuarioSesion) => u.rol === "dueno";

const SECCIONES: { titulo: string; enlaces: Enlace[] }[] = [
  {
    titulo: "Vender y cobrar",
    enlaces: [
      { href: "/panel/vender", icono: "📈", texto: "Registrar venta", ver: (u) => puede(u, "vender") },
      { href: "/panel/caja", icono: "🗄", texto: "Caja: abrir y cerrar", ver: (u) => puede(u, "caja") },
      { href: "/panel/pedidos", icono: "🛒", texto: "Pedidos de la tienda", ver: (u) => puede(u, "pedidos") },
      { href: "/panel/cotizaciones", icono: "📄", texto: "Cotizaciones", ver: (u) => puede(u, "cotizaciones") },
      { href: "/panel/deudas", icono: "💰", texto: "Cuentas por cobrar", ver: (u) => puede(u, "clientes") },
    ],
  },
  {
    titulo: "Inventario",
    enlaces: [
      { href: "/panel/inventario", icono: "📦", texto: "Productos" },
      { href: "/panel/inventario?filtro=bajo", icono: "⚠️", texto: "Por agotarse" },
      { href: "/panel/compras", icono: "🚚", texto: "Compras a proveedores", ver: (u) => puede(u, "compras") },
      { href: "/panel/inventario/conteo", icono: "📋", texto: "Conteo de inventario", ver: (u) => puede(u, "conteo") },
      { href: "/panel/inventario/masivo", icono: "✏️", texto: "Edición masiva", ver: (u) => puede(u, "inventario") },
      { href: "/panel/inventario/importar", icono: "📥", texto: "Cargar o bajar en Excel", ver: (u) => puede(u, "inventario") },
    ],
  },
  {
    titulo: "Números",
    enlaces: [
      { href: "/panel/balance", icono: "💵", texto: "Balance", ver: (u) => puede(u, "reportes") },
      { href: "/panel/reportes", icono: "📊", texto: "Reportes con filtros", ver: (u) => puede(u, "reportes") },
      { href: "/panel/estadisticas", icono: "📈", texto: "Estadísticas", ver: (u) => puede(u, "reportes") },
      { href: "/panel/gastos", icono: "📉", texto: "Gastos", ver: (u) => puede(u, "gastos") },
    ],
  },
  {
    titulo: "Personas",
    enlaces: [
      { href: "/panel/clientes", icono: "👥", texto: "Clientes", ver: (u) => puede(u, "clientes") },
      {
        href: "/panel/proveedores",
        icono: "🏭",
        texto: "Proveedores",
        ver: (u) => puede(u, "compras") || puede(u, "gastos"),
      },
      { href: "/panel/actividad", icono: "🔔", texto: "Actividad del equipo", ver: esDueno },
    ],
  },
  {
    titulo: "Configuración",
    enlaces: [
      { href: "/panel/tienda", icono: "🏪", texto: "Mi tienda", ver: esDueno },
      { href: "/panel/equipo", icono: "🧑‍🤝‍🧑", texto: "Equipo y permisos", ver: esDueno },
      { href: "/panel/cuenta", icono: "⚙️", texto: "Mi cuenta" },
    ],
  },
];

export default async function Explorar() {
  const usuario = await usuarioActual();
  if (!usuario) return null;
  const soporte = esCuentaDeSoporte(usuario.nombre, usuario.correo);

  return (
    <>
      <h1 className="mb-4 text-xl font-black tracking-tight">Explorar</h1>

      {SECCIONES.map((seccion) => {
        const enlaces = seccion.enlaces.filter((enlace) => !enlace.ver || enlace.ver(usuario));
        if (enlaces.length === 0) return null;
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

      {soporte && (
        <Link
          href="/panel/soporte"
          className="mb-3 block rounded-2xl border border-dashed border-gris2 bg-white p-4 text-center text-[13px] font-bold transition hover:bg-crema"
        >
          🛠 Soporte: franja de estado del trabajo
        </Link>
      )}

      <Link
        href="/docs"
        className="block rounded-2xl border border-linea bg-white p-4 text-center text-[13px] font-bold transition hover:bg-crema"
      >
        📖 Docs: cómo usar cada herramienta
      </Link>
    </>
  );
}
