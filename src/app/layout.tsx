// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

// Tipografía: la base (Century Gothic) se aplica a toda la interfaz vía
// fontFamily.sans en tailwind.config.js; la marca y los títulos principales de
// página (H1) usan .font-title (Boston Angel), pero NO los sub-encabezados de
// sección. Ambas se declaran como @font-face autohospedadas en globals.css.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Splash screens de iOS (Add to Home Screen). Cada imagen corresponde a la
// resolución exacta de un iPhone; iOS elige la que coincide con la media query.
// Las imágenes se generan con scripts/generate-pwa-icons.mjs. Solo retrato.
const iosSplash = (
  cssW: number,
  cssH: number,
  ratio: number,
  pxW: number,
  pxH: number,
) => ({
  url: `/splash/splash-${pxW}x${pxH}.png`,
  media: `screen and (device-width: ${cssW}px) and (device-height: ${cssH}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
});

// CAMBIO DE MARCA: TANGIBLE
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "Tangible",
  title: {
    default: "Tangible | Nails & Art Studio",
    template: "%s | Tangible",
  },
  description: "Reserva tu experiencia de uñas y diseño en Tangible.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Tangible",
    // Texto oscuro sobre el fondo crema claro de la app.
    statusBarStyle: "default",
    startupImage: [
      iosSplash(320, 568, 2, 640, 1136),   // iPhone SE 1ª gen
      iosSplash(375, 667, 2, 750, 1334),   // iPhone SE 2/3, 6/7/8
      iosSplash(414, 896, 2, 828, 1792),   // iPhone XR, 11
      iosSplash(375, 812, 3, 1125, 2436),  // iPhone X, XS, 11 Pro
      iosSplash(390, 844, 3, 1170, 2532),  // iPhone 12, 13, 14
      iosSplash(393, 852, 3, 1179, 2556),  // iPhone 14 Pro, 15, 16
      iosSplash(414, 736, 3, 1242, 2208),  // iPhone 6/7/8 Plus
      iosSplash(414, 896, 3, 1242, 2688),  // iPhone XS Max, 11 Pro Max
      iosSplash(428, 926, 3, 1284, 2778),  // iPhone 12/13 Pro Max, 14 Plus
      iosSplash(430, 932, 3, 1290, 2796),  // iPhone 14/15 Pro Max, 16 Plus
    ],
  },
  // Next emite `mobile-web-app-capable` (estándar) a partir de appleWebApp.capable.
  // Añadimos la variante histórica de Apple para iOS antiguos (< 16.4), que aún
  // la requiere para abrir en modo standalone.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  // No usamos viewport-fit: cover: dejamos que iOS inserte el contenido bajo la
  // barra de estado (statusBarStyle "default") para que los encabezados nunca
  // queden ocultos por el notch en modo standalone.
  // El usuario puede hacer zoom (accesibilidad); no lo bloqueamos.
  maximumScale: 5,
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
