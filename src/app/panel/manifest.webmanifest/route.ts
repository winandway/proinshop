import { ICONOS_APP } from "@/lib/iconos-app";

/**
 * El manifiesto del panel: al instalarlo desde el panel, el ícono del
 * celular abre directo en el panel del negocio (como la app de Treinta), no
 * en la tienda.
 */
export function GET() {
  return Response.json(
    {
      id: "/panel",
      name: "Proinshop · Mi negocio",
      short_name: "Proinshop",
      description: "Ventas, inventario, caja, clientes y tu tienda en línea.",
      start_url: "/panel",
      scope: "/panel",
      display: "standalone",
      orientation: "portrait",
      background_color: "#faf7f4",
      theme_color: "#ff2d2d",
      lang: "es",
      categories: ["business", "finance", "productivity"],
      icons: ICONOS_APP,
    },
    { headers: { "content-type": "application/manifest+json; charset=utf-8" } },
  );
}
