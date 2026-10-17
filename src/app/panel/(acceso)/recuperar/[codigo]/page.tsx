import Link from "next/link";
import type { Metadata } from "next";
import { FormularioAcceso } from "@/componentes/panel/FormularioAcceso";
import { baseDeDatos } from "@/lib/d1";
import { restablecerContrasena } from "../../../acciones";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

export default async function Recuperar({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const db = await baseDeDatos();

  const valida = db
    ? await db
        .prepare(
          `SELECT r.codigo, u.nombre, u.correo
           FROM recuperacion r JOIN usuario u ON u.id = r.usuario_id
           WHERE r.codigo = ? AND r.usada = 0 AND r.expira > datetime('now')`,
        )
        .bind(codigo)
        .first<{ codigo: string; nombre: string; correo: string | null }>()
        .catch(() => null)
    : null;

  if (!valida) {
    return (
      <>
        <h1 className="text-xl font-black tracking-tight">Enlace vencido</h1>
        <p className="mb-6 mt-1.5 text-[13px] text-gris">
          Este enlace ya se usó o pasaron sus 2 horas. Pídele al propietario que
          te genere otro desde Equipo.
        </p>
        <Link
          href="/panel/entrar"
          className="block rounded-2xl bg-rojo py-4 text-center text-sm font-extrabold text-white transition hover:bg-rojo-oscuro"
        >
          Volver a entrar
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-black tracking-tight">Elige tu contraseña nueva</h1>
      <p className="mb-6 mt-1.5 text-[13px] text-gris">
        Cuenta de <b className="text-tinta">{valida.nombre}</b>
        {valida.correo ? ` · ${valida.correo}` : ""}
      </p>

      <FormularioAcceso
        clave="acceso-recuperar"
        accion={restablecerContrasena}
        boton="Guardar y entrar"
        botonEnviando="Guardando…"
        campos={[
          { nombre: "codigo", etiqueta: "Código", valor: codigo, soloLectura: true },
          {
            nombre: "contrasena",
            etiqueta: "Contraseña nueva",
            tipo: "password",
            ayuda: "Mínimo 8 caracteres, con letras y números.",
          },
          { nombre: "repetida", etiqueta: "Repite la contraseña", tipo: "password" },
        ]}
      />
    </>
  );
}
