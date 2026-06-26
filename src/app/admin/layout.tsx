import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminPwaMetadata } from "@/lib/pwa-metadata";

// La PWA instalable (manifest + tags de Apple) solo se enlaza en el panel.
export const metadata = adminPwaMetadata;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <>{children}</>;
}