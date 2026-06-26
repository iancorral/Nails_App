import type { ReactNode } from "react";
import { adminPwaMetadata } from "@/lib/pwa-metadata";

// El login es la puerta de entrada al panel: aquí también enlazamos el manifest
// para que la administradora pueda instalar la PWA desde esta pantalla (antes de
// iniciar sesión). La página de login es un client component y no puede exportar
// `metadata`, por eso lo hacemos en este layout (server component).
export const metadata = adminPwaMetadata;

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
