import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/contenedores/manifest.webmanifest",
};

export default function ContenedoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
