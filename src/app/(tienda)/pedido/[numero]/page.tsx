import type { Metadata } from "next";
import { SeguimientoPedido } from "@/componentes/SeguimientoPedido";
import { textos } from "@/lib/i18n";
import { idiomaActual } from "@/lib/idioma-servidor";
import { obtenerConfigTienda } from "@/lib/config-tienda";
import { obtenerPedidoPublico } from "@/lib/pedidos";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}): Promise<Metadata> {
  const { numero } = await params;
  const idioma = await idiomaActual();
  return { title: `${textos(idioma).pedido} #${numero}`, robots: { index: false } };
}

export default async function PaginaPedido({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const idioma = await idiomaActual();
  const [config, pedido] = await Promise.all([
    obtenerConfigTienda(),
    obtenerPedidoPublico(numero),
  ]);

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <SeguimientoPedido
        numero={numero}
        idioma={idioma}
        whatsapp={config.whatsapp}
        pedido={pedido}
      />
    </div>
  );
}
