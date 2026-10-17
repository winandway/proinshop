import { redirect } from "next/navigation";
import { BarraInferior, MenuLateral } from "@/componentes/panel/BarraInferior";
import { FranjaTrabajo } from "@/componentes/panel/FranjaTrabajo";
import { BotonSalir } from "@/componentes/panel/BotonSalir";
import { ZonaHoraria } from "@/componentes/panel/ZonaHoraria";
import { ProveedorBorrador } from "@/componentes/GuardaBorrador";
import { NOMBRE_ROL, usuarioActual } from "@/lib/sesion";
import { salir } from "../acciones";

/**
 * Marco del panel. Toda ruta que cuelgue de aquí exige sesión: la comprobación
 * vive en el layout, no en cada página, para que no se pueda olvidar en una.
 */
export default async function DisenoPanel({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/panel/entrar");

  return (
    <div className="min-h-screen bg-crema pb-[74px] md:pb-0">
      <header className="bg-rojo px-4 py-3 text-white">
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

      <ZonaHoraria />
      <FranjaTrabajo />

      <div className="mx-auto flex max-w-5xl">
        <MenuLateral esDueno={usuario.rol === "dueno"} />
        <main className="min-w-0 flex-1 p-4">
          {/* Cada borrador lleva la cuenta: en una computadora compartida
              nadie ve lo que dejó escrito otro. */}
          <ProveedorBorrador dueno={String(usuario.id)}>{children}</ProveedorBorrador>
        </main>
      </div>

      <BarraInferior esDueno={usuario.rol === "dueno"} />
    </div>
  );
}
