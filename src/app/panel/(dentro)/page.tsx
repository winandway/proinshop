import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Inicio", robots: { index: false } };

const ACCESOS = [
  { href: "/panel/vender", icono: "📈", texto: "Registrar\nVenta", oscuro: true },
  { href: "/panel/gastos/nuevo", icono: "📉", texto: "Registrar\nGasto" },
  { href: "/panel/inventario/nuevo", icono: "📷", texto: "Cargar\nProducto" },
];

const MODULOS = [
  { href: "/panel/inventario", icono: "📦", texto: "Inventario" },
  { href: "/panel/pedidos", icono: "🛒", texto: "Pedidos" },
  { href: "/panel/tienda", icono: "🏪", texto: "Mi tienda" },
  { href: "/panel/estadisticas", icono: "📊", texto: "Estadísticas" },
  { href: "/panel/clientes", icono: "👥", texto: "Clientes" },
  { href: "/panel/deudas", icono: "💰", texto: "Deudas" },
  { href: "/panel/cotizaciones", icono: "📄", texto: "Cotizaciones" },
  { href: "/panel/proveedores", icono: "🚚", texto: "Proveedores" },
];

export default async function InicioPanel() {
  const usuario = await usuarioActual();
  const db = await baseDeDatos();

  const resumen = db
    ? await db
        .prepare(
          `SELECT
             (SELECT COALESCE(SUM(total), 0) FROM venta WHERE date(fecha) = date('now')) AS ventas,
             (SELECT COALESCE(SUM(monto), 0) FROM gasto WHERE date(fecha) = date('now')) AS gastos,
             (SELECT COUNT(*) FROM pedido WHERE estado = 'nuevo') AS pedidos,
             (SELECT COUNT(*) FROM producto WHERE publicado = 1) AS productos`,
        )
        .first<{ ventas: number; gastos: number; pedidos: number; productos: number }>()
    : null;

  const ventas = resumen?.ventas ?? 0;
  const gastos = resumen?.gastos ?? 0;

  return (
    <>
      <h1 className="sr-only">Panel de {usuario?.nombre}</h1>

      <h2 className="mb-3 text-[13px] font-extrabold">Accesos rápidos</h2>
      <div className="flex gap-2.5">
        {ACCESOS.map((acceso) => (
          <Link
            key={acceso.href}
            href={acceso.href}
            className={`flex-1 rounded-2xl p-3 shadow-sm transition hover:shadow-md ${
              acceso.oscuro ? "bg-tinta text-white" : "bg-white"
            }`}
          >
            <span aria-hidden="true" className="mb-6 block text-lg">
              {acceso.icono}
            </span>
            <span className="block whitespace-pre-line text-[12.5px] font-bold leading-tight">
              {acceso.texto}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-linear-to-br from-[#ff3b3b] to-[#d91414] p-4 text-white shadow-lg">
        <p className="text-xs font-semibold opacity-90">Hoy vendiste</p>
        <p className="mt-0.5 text-3xl font-black tracking-tight">{formatearPrecio(ventas)}</p>
        <div className="mt-3 flex gap-2.5">
          <div className="flex-1 rounded-xl bg-white/20 px-3 py-2">
            <span className="block text-[10.5px] font-semibold opacity-90">↗ Ingresos</span>
            <b className="text-[15px] font-extrabold">{formatearPrecio(ventas)}</b>
          </div>
          <div className="flex-1 rounded-xl bg-white/20 px-3 py-2">
            <span className="block text-[10.5px] font-semibold opacity-90">↙ Egresos</span>
            <b className="text-[15px] font-extrabold">-{formatearPrecio(gastos)}</b>
          </div>
        </div>
        <Link href="/panel/balance" className="mt-3 block text-[12.5px] font-bold">
          Ver balance ›
        </Link>
      </div>

      <h2 className="mb-3 mt-5 text-[13px] font-extrabold">Sugeridos para ti</h2>
      <div className="grid grid-cols-4 gap-2.5">
        {MODULOS.map((modulo) => (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="relative rounded-2xl bg-white px-1 py-3 text-center shadow-sm transition hover:shadow-md"
          >
            {modulo.href === "/panel/pedidos" && (resumen?.pedidos ?? 0) > 0 && (
              <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-rojo" />
            )}
            <span aria-hidden="true" className="mb-1.5 block text-xl">
              {modulo.icono}
            </span>
            <span className="block text-[9.7px] font-bold leading-tight">{modulo.texto}</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-linea bg-white p-4">
        <p className="text-[13px] font-extrabold">Tu tienda</p>
        <p className="mt-1 text-[12.5px] text-gris">
          {resumen?.productos ?? 0} productos publicados ·{" "}
          {(resumen?.pedidos ?? 0) === 0
            ? "sin pedidos nuevos"
            : `${resumen?.pedidos} pedido(s) por atender`}
        </p>
        <a
          href="https://proinshop.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-xl border-[1.5px] border-linea px-4 py-2.5 text-[12.5px] font-bold transition hover:border-gris2"
        >
          Ver mi tienda ↗
        </a>
      </div>
    </>
  );
}
