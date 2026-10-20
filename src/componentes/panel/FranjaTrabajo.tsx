import { franjaActiva } from "@/lib/franja";

/**
 * Franja discreta arriba del panel. No es una ventana: no tapa nada, no hay
 * que cerrarla y no reaparece. Cuenta en qué estamos trabajando y, cuando
 * quien paga el trabajo lo autoriza, pasa a verde para pedirle al dueño que
 * lo pruebe.
 */
export async function FranjaTrabajo() {
  const franja = await franjaActiva();
  if (!franja) return null;

  if (franja.estado === "terminado") {
    return (
      <div role="status" className="border-b border-verde/30 bg-verde-suave px-4 py-2 print:hidden">
        <p className="mx-auto max-w-5xl text-[12px] font-bold text-[#0b6e3a]">
          Terminamos: {franja.trabajo}. Ahora te toca probarlo y decirnos si algo falta.
        </p>
      </div>
    );
  }

  return (
    <div role="status" className="border-b border-linea bg-white px-4 py-2 print:hidden">
      <div className="mx-auto max-w-5xl">
        <p className="text-[12px] text-gris">
          <b className="text-tinta">Estamos trabajando en:</b> {franja.trabajo}. Pronto estará
          listo.
        </p>
        <div aria-hidden="true" className="barra-proceso mt-1.5 h-1 rounded-full" />
      </div>
    </div>
  );
}
