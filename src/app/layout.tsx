import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Editorial Menu Demo",
  description: "Landing, demo publica y panel admin para menus visuales de restaurantes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
