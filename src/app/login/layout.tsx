import type { ReactNode } from "react";
import { adminPwaMetadata } from "@/lib/pwa-metadata";

export const metadata = adminPwaMetadata;

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
