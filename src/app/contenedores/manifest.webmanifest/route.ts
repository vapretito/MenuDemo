import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const group = await prisma.restaurantGroup.findUnique({
    where: {
      slug: "contenedores",
    },
    select: {
      name: true,
      slug: true,
      description: true,
      accentColor: true,
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Grupo no encontrado." }, { status: 404 });
  }

  return new NextResponse(
    JSON.stringify({
      id: `/${group.slug}`,
      name: `${group.name} | Menui`,
      short_name: group.name,
      description: group.description || `${group.name} en Menui`,
      start_url: `/${group.slug}`,
      scope: `/${group.slug}/`,
      display: "standalone",
      background_color: "#fff8ef",
      theme_color: group.accentColor,
      icons: [
        {
          src: "/logos/menui-logo.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any",
        },
      ],
    }),
    {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    }
  );
}
