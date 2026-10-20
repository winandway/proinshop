import { redirect } from "next/navigation";
import { BarraInferior, MenuLateral } from "@/componentes/panel/BarraInferior";
import { FranjaTrabajo } from "@/componentes/panel/FranjaTrabajo";
import { BotonSalir } from "@/componentes/panel/BotonSalir";
import { ZonaHoraria } from "@/componentes/panel/ZonaHoraria";
import { AvisosEnVivo } from "@/componentes/panel/AvisosEnVivo";
import { EstadoConexion } from "@/componentes/panel/EstadoConexion";
import { ProveedorBorrador } from "@/componentes/GuardaBorrador";
import { NOMBRE_ROL, puede, usuarioActual } from "@/lib/sesion";
import { salir } from "../acciones";

/**
 * Marco del panel. Toda ruta que cuelgue de aquí exige sesión: la comprobación
 * vive en el layout, no en cada página, para que no se pueda olvidar en una.
 */
export default async function DisenoPanel({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/panel/entrar");

  // Lo que se deja guardado para abrir sin señal, según lo que puede usar.
  const precargar = ["/panel"];
  if (puede(usuario, "vender")) precargar.push("/panel/vender");
  precargar.push("/panel/inventario");

  return (
    <div className="min-h-screen bg-crema pb-[74px] md:pb-0 print:bg-white print:pb-0">
      <header className="bg-rojo px-4 py-3 text-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-base"
          >
            👤
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-extrabold leading-tight">{usuario.nombre}</p>
            <p className="text-[11.5px] text-white/80">{NOMBRE_ROL[usuario.rol]}</p>
          </div>

          <BotonSalir salir={salir} dueno={String(usuario.id)} />
        </div>
      </header>

      <EstadoConexion dueno={String(usuario.id)} precargar={precargar} />
      <ZonaHoraria />
      <FranjaTrabajo />
      <AvisosEnVivo />

      <div className="mx-auto flex max-w-5xl">
        <MenuLateral verReportes={puede(usuario, "reportes")} />
        <main className="min-w-0 flex-1 p-4">
          {/* Cada borrador lleva la cuenta: en una computadora compartida
              nadie ve lo que dejó escrito otro. */}
          <ProveedorBorrador dueno={String(usuario.id)}>{children}</ProveedorBorrador>
        </main>
      </div>

      <BarraInferior verReportes={puede(usuario, "reportes")} />
    </div>
  );
}
