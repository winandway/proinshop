import Link from "next/link";
import type { Metadata } from "next";
import { baseDeDatos } from "@/lib/d1";
import { formatearPrecio } from "@/lib/i18n";
import { cajaAbierta } from "@/lib/caja";
import { enMoneda2 } from "@/lib/moneda";
import { datosNegocio } from "@/lib/negocio";
import type { Modulo } from "@/lib/permisos";
import { puede, usuarioActual } from "@/lib/sesion";
import { horaLocal, minutosZona, modificadorZona } from "@/lib/zona";
import { InstalarApp } from "@/componentes/InstalarApp";
import { PrimerosPasos } from "@/componentes/panel/PrimerosPasos";
import { avance, primerosPasos } from "@/lib/primeros-pasos";

export const metadata: Metadata = { title: "Inicio", robots: { index: false } };

const ACCESOS: { href: string; icono: string; texto: string; oscuro?: boolean; permiso: Modulo }[] = [
  { href: "/panel/vender", icono: "📈", texto: "Registrar\nVenta", oscuro: true, permiso: "vender" },
  { href: "/panel/gastos/nuevo", icono: "📉", texto: "Registrar\nGasto", permiso: "gastos" },
  { href: "/panel/inventario/nuevo", icono: "📷", texto: "Cargar\nProducto", permiso: "inventario" },
  { href: "/panel/compras/nueva", icono: "🚚", texto: "Registrar\nCompra", permiso: "compras" },
];

const MODULOS: { href: string; icono: string; texto: string; permiso?: Modulo; soloDueno?: boolean }[] = [
  { href: "/panel/inventario", icono: "📦", texto: "Inventario" },
  { href: "/panel/pedidos", icono: "🛒", texto: "Pedidos", permiso: "pedidos" },
  { href: "/panel/caja", icono: "🗄", texto: "Caja", permiso: "caja" },
  { href: "/panel/reportes", icono: "📊", texto: "Reportes", permiso: "reportes" },
  { href: "/panel/clientes", icono: "👥", texto: "Clientes", permiso: "clientes" },
  { href: "/panel/deudas", icono: "💰", texto: "Deudas", permiso: "clientes" },
  { href: "/panel/cotizaciones", icono: "📄", texto: "Cotizaciones", permiso: "cotizaciones" },
  { href: "/panel/compras", icono: "🚚", texto: "Compras", permiso: "compras" },
  { href: "/panel/tienda", icono: "🏪", texto: "Mi tienda", soloDueno: true },
  { href: "/panel/actividad", icono: "🔔", texto: "Actividad", soloDueno: true },
];

export default async function InicioPanel({
  searchParams,
}: {
  searchParams: Promise<{ sin_permiso?: string }>;
}) {
  const { sin_permiso } = await searchParams;
  const usuario = await usuarioActual();
  const db = await baseDeDatos();
  const zona = await modificadorZona();
  const minutos = await minutosZona();
  const negocio = await datosNegocio();

  const verReportes = puede(usuario, "reportes");
  const verInventario = puede(usuario, "inventario") || puede(usuario, "compras") || usuario?.rol === "dueno";
  const verClientes = puede(usuario, "clientes");
  const verCaja = puede(usuario, "caja");
  const esDueno = usuario?.rol === "dueno";

  const resumen = db
    ? await db
        .prepare(
          `SELECT
             (SELECT COALESCE(SUM(total), 0) FROM venta
              WHERE date(fecha, ${zona}) = date('now', ${zona}) AND COALESCE(anulada, 0) = 0) AS ventas,
             (SELECT COUNT(*) FROM venta
              WHERE date(fecha, ${zona}) = date('now', ${zona}) AND COALESCE(anulada, 0) = 0) AS numero,
             (SELECT COALESCE(SUM(monto), 0) FROM gasto WHERE date(fecha, ${zona}) = date('now', ${zona})) AS gastos,
             (SELECT COUNT(*) FROM pedido WHERE estado = 'nuevo') AS pedidos,
             (SELECT COUNT(*) FROM producto WHERE publicado = 1) AS productos,
             (SELECT COUNT(*) FROM producto WHERE COALESCE(es_servicio, 0) = 0
                AND stock <= CASE WHEN stock_minimo > 0 THEN stock_minimo ELSE ? END) AS por_agotarse,
             (SELECT COUNT(*) FROM deuda WHERE saldo > 0 AND vence IS NOT NULL AND vence < date('now', ${zona})) AS vencidas,
             (SELECT COALESCE(SUM(saldo), 0) FROM deuda WHERE saldo > 0 AND vence IS NOT NULL AND vence < date('now', ${zona})) AS monto_vencido`,
        )
        .bind(negocio.umbralStock)
        .first<{
          ventas: number;
          numero: number;
          gastos: number;
          pedidos: number;
          productos: number;
          por_agotarse: number;
          vencidas: number;
          monto_vencido: number;
        }>()
    : null;

  const caja = db && verCaja ? await cajaAbierta(db) : null;

  // Los primeros pasos son para el dueño: lo que deja el negocio andando.
  const pasos =
    db && esDueno && usuario
      ? primerosPasos({
          whatsapp: negocio.whatsapp,
          ...((await db
            .prepare(
              `SELECT (SELECT COUNT(*) FROM producto) AS productos,
                      (SELECT COUNT(*) FROM venta) AS ventas,
                      (SELECT COUNT(*) FROM caja) AS cajas,
                      (SELECT COUNT(*) FROM usuario WHERE activo = 1) AS personas,
                      (SELECT COUNT(*) FROM llave_acceso WHERE usuario_id = ?) AS huellas,
                      (SELECT COUNT(*) FROM suscripcion_aviso WHERE usuario_id = ?) AS avisos`,
            )
            .bind(usuario.id, usuario.id)
            .first<{ productos: number; ventas: number; cajas: number; personas: number; huellas: number; avisos: number }>()) ?? {
            productos: 0,
            ventas: 0,
            cajas: 0,
            personas: 1,
            huellas: 0,
            avisos: 0,
          }),
        })
      : null;
  const ventas = resumen?.ventas ?? 0;
  const gastos = resumen?.gastos ?? 0;
  const otra = enMoneda2(ventas, negocio.moneda2, negocio.tasa2);
  const accesos = ACCESOS.filter((a) => puede(usuario, a.permiso)).slice(0, 3);
  const modulos = MODULOS.filter((m) => (m.soloDueno ? esDueno : !m.permiso || puede(usuario, m.permiso)));

  return (
    <>
      <h1 className="sr-only">Panel de {usuario?.nombre}</h1>

      {sin_permiso && (
        <p role="alert" className="mb-3 rounded-xl border border-rojo bg-rojo-suave px-3.5 py-2.5 text-[12.5px] font-bold text-rojo-oscuro">
          Tu cuenta no tiene permiso para esa sección. Pídeselo al propietario.
        </p>
      )}

      {pasos && <PrimerosPasos pasos={pasos} avance={avance(pasos)} />}

      {accesos.length > 0 && (
        <>
          <h2 className="mb-3 text-[13px] font-extrabold">Accesos rápidos</h2>
          <div className="flex gap-2.5">
            {accesos.map((acceso) => (
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
        </>
      )}

      {verReportes && (
        <div className="mt-3 rounded-2xl bg-linear-to-br from-[#ff3b3b] to-[#d91414] p-4 text-white shadow-lg">
          <p className="text-xs font-semibold opacity-90">
            Hoy vendiste · {resumen?.numero ?? 0} venta{(resumen?.numero ?? 0) === 1 ? "" : "s"}
          </p>
          <p className="mt-0.5 text-3xl font-black tracking-tight">{formatearPrecio(ventas)}</p>
          {otra && <p className="text-[12px] font-bold opacity-90">{otra}</p>}
          <div className="mt-3 flex gap-2.5">
            <div className="flex-1 rounded-xl bg-white/20 px-3 py-2">
              <span className="block text-[10.5px] font-semibold opacity-90">↗ Ingresos</span>
              <b className="text-[15px] font-extrabold">{formatearPrecio(ventas)}</b>
            </div>
            <div className="flex-1 rounded-xl bg-white/20 px-3 py-2">
              <span className="block text-[10.5px] font-semibold opacity-90">↙ Egresos</span>
              <b className="text-[15px] font-extrabold">
                {gastos > 0 ? "-" : ""}
                {formatearPrecio(gastos)}
              </b>
            </div>
          </div>
          <Link href="/panel/balance" className="mt-3 block text-[12.5px] font-bold">
            Ver balance ›
          </Link>
        </div>
      )}

      {/* Lo que pide atención hoy: solo a quien le toca. */}
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {verCaja && (
          <Link
            href="/panel/caja"
            className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm transition hover:shadow-md"
          >
            <span aria-hidden="true" className="text-xl">
              🗄
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-extrabold">
                {caja ? "Caja abierta" : "Caja cerrada"}
              </span>
              <span className="block truncate text-[11px] text-gris">
                {caja ? `Desde ${horaLocal(caja.abierta_en, minutos).slice(11)}` : "Toca para abrirla"}
              </span>
            </span>
            <span className={`h-2.5 w-2.5 rounded-full ${caja ? "bg-verde" : "bg-gris2"}`} />
          </Link>
        )}
        {verInventario && (resumen?.por_agotarse ?? 0) > 0 && (
          <Link
            href="/panel/inventario?filtro=bajo"
            className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-ambar/40 transition hover:shadow-md"
          >
            <span aria-hidden="true" className="text-xl">
              ⚠️
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-extrabold">
                {resumen?.por_agotarse} producto{resumen?.por_agotarse === 1 ? "" : "s"} por agotarse
              </span>
              <span className="block text-[11px] text-gris">Toca para ver cuáles</span>
            </span>
          </Link>
        )}
        {verClientes && (resumen?.vencidas ?? 0) > 0 && (
          <Link
            href="/panel/deudas"
            className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-rojo/30 transition hover:shadow-md"
          >
            <span aria-hidden="true" className="text-xl">
              💰
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-extrabold text-rojo-oscuro">
                {resumen?.vencidas} cobro{resumen?.vencidas === 1 ? "" : "s"} vencido{resumen?.vencidas === 1 ? "" : "s"}
              </span>
              <span className="block text-[11px] text-gris">
                {formatearPrecio(resumen?.monto_vencido ?? 0)} por cobrar
              </span>
            </span>
          </Link>
        )}
      </div>

      <h2 className="mb-3 mt-5 text-[13px] font-extrabold">Sugeridos para ti</h2>
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
        {modulos.map((modulo) => (
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

      <InstalarApp compacto />
    </>
  );
}
