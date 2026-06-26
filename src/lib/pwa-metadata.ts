import type { Metadata } from "next";

// Metadatos que convierten una ruta en PWA INSTALABLE (manifest + tags de Apple
// + splash de iOS). Se aplican SOLO en /login y /admin (ver sus layouts), de modo
// que la app instalable sea exclusiva del panel de la administradora.
//
// La landing pública (clientas que llegan por el link de Instagram) NO enlaza el
// manifest ni estos tags, así que el navegador no les ofrece "instalar la app":
// ellas solo usan la web de reservas con normalidad.

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

export const adminPwaMetadata: Metadata = {
  manifest: "/manifest.webmanifest",
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
  // Next emite `mobile-web-app-capable` (estándar) desde appleWebApp.capable.
  // Añadimos la variante histórica de Apple para iOS < 16.4.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};
