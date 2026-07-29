import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FormularioAcceso } from "@/componentes/panel/FormularioAcceso";
import { entrar } from "../../acciones";
import { hayUsuarios, usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function Entrar() {
  if (await usuarioActual()) redirect("/panel");

  // Si nadie se ha registrado, no tiene sentido pedir credenciales: lo que
  // toca es crear la cuenta del propietario.
  if (!(await hayUsuarios())) redirect("/panel/crear-cuenta");

  return (
    <>
      <h1 className="text-xl font-black tracking-tight">Entra a tu negocio</h1>
      <p className="mb-6 mt-1.5 text-[13px] text-gris">
        Administra tu inventario, tus ventas y tu tienda.
      </p>

      <FormularioAcceso
        accion={entrar}
        boton="Entrar"
        botonEnviando="Entrando…"
        campos={[
          {
            nombre: "correo",
            etiqueta: "Correo electrónico",
            tipo: "email",
            marcador: "correo@ejemplo.com",
          },
          { nombre: "contrasena", etiqueta: "Contraseña", tipo: "password" },
        ]}
      />

      <p className="mt-6 text-center text-[12.5px] text-gris">
        ¿Te invitaron a trabajar aquí?{" "}
        <Link href="/panel/invitacion" className="font-bold text-rojo hover:underline">
          Usa tu invitación
        </Link>
      </p>
    </>
  );
}
