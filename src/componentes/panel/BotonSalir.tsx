"use client";

import { borrarBorradoresDe } from "@/componentes/GuardaBorrador";
import { borrarCopiasDePaginas } from "@/componentes/ServicioSinSenal";

/**
 * Salir de verdad: además de cerrar la sesión en el servidor, borra los
 * borradores de esta cuenta y las copias del panel guardadas para usarlo sin
 * señal. En una computadora compartida, el siguiente no ve nada del anterior.
 */
export function BotonSalir({ salir, dueno }: { salir: () => Promise<void>; dueno: string }) {
  return (
    <form
      action={salir}
      onSubmit={() => {
        borrarBorradoresDe(dueno);
        void borrarCopiasDePaginas();
      }}
      className="ml-auto"
    >
      <button
        type="submit"
        className="rounded-xl bg-white/20 px-3.5 py-2 text-[12px] font-bold transition hover:bg-white/30"
      >
        Salir
      </button>
    </form>
  );
}
