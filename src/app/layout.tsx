// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

// Tipografía: la base (Century Gothic) se aplica a toda la interfaz vía
// fontFamily.sans en tailwind.config.js; la marca y los títulos principales de
// página (H1) usan .font-title (Boston Angel), pero NO los sub-encabezados de
// sección. Ambas se declaran como @font-face autohospedadas en globals.css.

// CAMBIO DE MARCA: TANGIBLE
export const metadata: Metadata = {
  title: "TANGIBLE | Nails & Art Studio",
  description: "Reserva tu experiencia de uñas y diseño en Tangible.",
  icons: {
    icon: '/logo-tangible.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}