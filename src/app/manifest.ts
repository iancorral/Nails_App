import type { MetadataRoute } from "next";

// Web App Manifest (servido automáticamente por Next en /manifest.webmanifest).
// Next inyecta el <link rel="manifest"> en el <head> sin configuración extra.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tangible | Nails & Art Studio",
    short_name: "Tangible",
    description: "Reserva tu experiencia de uñas y diseño en Tangible.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    // Lienzo del splash de Android y color de la barra de herramientas.
    background_color: "#FAF7F2",
    theme_color: "#FAF7F2",
    categories: ["business", "lifestyle", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
