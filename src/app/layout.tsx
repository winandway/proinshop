import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Encabezado } from "@/componentes/Encabezado";
import { PieDePagina } from "@/componentes/PieDePagina";
import { ProveedorCarrito } from "@/componentes/carrito";
import { NEGOCIO } from "@/lib/config";
import { idiomaActual } from "@/lib/idioma-servidor";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaActual();
  const es = idioma === "es";

  return {
    metadataBase: new URL(NEGOCIO.url),
    title: {
      default: es
        ? "Proinshop | Importación directa desde China"
        : "Proinshop | Direct import from China",
      template: "%s | Proinshop",
    },
    description: es
      ? "Plantas eléctricas, motos, bicicletas, herramientas y repuestos importados directamente de fábrica. Precios al por mayor y garantía de 12 meses."
      : "Generators, motorcycles, bicycles, tools and spare parts imported straight from the factory. Wholesale pricing and a 12-month warranty.",
    applicationName: NEGOCIO.nombre,
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      siteName: NEGOCIO.nombre,
      locale: es ? "es_US" : "en_US",
      url: NEGOCIO.url,
      title: es
        ? "Proinshop | Importación directa desde China"
        : "Proinshop | Direct import from China",
      description: es
        ? "Plantas eléctricas, motos, bicicletas, herramientas y repuestos con garantía y precios de mayorista."
        : "Generators, motorcycles, bicycles, tools and spare parts with warranty and wholesale pricing.",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#ff2d2d",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const idioma = await idiomaActual();

  return (
    <html lang={idioma} className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white">
        <ProveedorCarrito>
          <Encabezado />
          <main className="flex-1">{children}</main>
          <PieDePagina />
        </ProveedorCarrito>
      </body>
    </html>
  );
}
