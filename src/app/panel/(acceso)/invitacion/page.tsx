import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FormularioAcceso } from "@/componentes/panel/FormularioAcceso";
import { aceptarInvitacion } from "../../acciones";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Invitación", robots: { index: false } };

export default async function Invitacion({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  if (await usuarioActual()) redirect("/panel");
  const { codigo } = await searchParams;

  return (
    <>
      <h1 className="text-xl font-black tracking-tight">Crea tu cuenta</h1>
      <p className="mb-6 mt-1.5 text-[13px] text-gris">
        Elige tu contraseña para entrar al panel del negocio.
      </p>

      <FormularioAcceso
        accion={aceptarInvitacion}
        boton="Crear mi cuenta"
        botonEnviando="Creando…"
        campos={[
          {
            nombre: "codigo",
            etiqueta: "Código de invitación",
            marcador: "Pega aquí el código que te pasaron",
            valor: codigo,
            soloLectura: Boolean(codigo),
          },
          { nombre: "nombre", etiqueta: "Tu nombre", marcador: "Nombre y apellido" },
          {
            nombre: "correo",
            etiqueta: "Correo electrónico",
            tipo: "email",
            marcador: "correo@ejemplo.com",
          },
          {
            nombre: "contrasena",
            etiqueta: "Contraseña",
            tipo: "password",
            ayuda: "Mínimo 8 caracteres, con letras y números.",
          },
          { nombre: "repetida", etiqueta: "Repite la contraseña", tipo: "password" },
        ]}
      />

      <p className="mt-6 text-center text-[12.5px] text-gris">
        ¿Ya tienes cuenta?{" "}
        <Link href="/panel/entrar" className="font-bold text-rojo hover:underline">
          Entra aquí
        </Link>
      </p>
    </>
  );
}
