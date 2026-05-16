import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";
import { menuTemplates } from "@/data/menu-templates";

export async function PATCH(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const menuTemplate = String(body.menuTemplate ?? "classic-delivery");
    const selectedTemplate = menuTemplates.find(
      (template) => template.id === menuTemplate
    );

    if (!selectedTemplate) {
      return NextResponse.json(
        { error: "Plantilla inválida." },
        { status: 400 }
      );
    }

    const logoUrl = String(body.logoUrl ?? "").trim() || null;
    const coverImageUrl = String(body.coverImageUrl ?? "").trim() || null;

    const accent = String(body.accent ?? selectedTemplate.accent).trim();
    const accentSoft = String(body.accentSoft ?? selectedTemplate.accentSoft).trim();
    const surface = String(body.surface ?? selectedTemplate.surface).trim();
    const surfaceAlt = String(body.surfaceAlt ?? selectedTemplate.surfaceAlt).trim();
    const border = String(body.border ?? selectedTemplate.border).trim();
    const text = String(body.text ?? selectedTemplate.text).trim();
    const muted = String(body.muted ?? selectedTemplate.muted).trim();
    const heroGradient = String(
      body.heroGradient ?? selectedTemplate.heroGradient
    ).trim();

    const restaurant = await prisma.restaurant.update({
      where: {
        id: session.restaurantId,
      },
      data: {
        menuTemplate,
        logoUrl,
        coverImageUrl,
        accent,
        accentSoft,
        surface,
        surfaceAlt,
        border,
        text,
        muted,
        heroGradient,
      },
    });

    return NextResponse.json({
      ok: true,
      restaurant: {
        id: restaurant.id,
        menuTemplate: restaurant.menuTemplate,
        logoUrl: restaurant.logoUrl,
        coverImageUrl: restaurant.coverImageUrl,
        theme: {
          accent: restaurant.accent,
          accentSoft: restaurant.accentSoft,
          surface: restaurant.surface,
          surfaceAlt: restaurant.surfaceAlt,
          border: restaurant.border,
          text: restaurant.text,
          muted: restaurant.muted,
          heroGradient: restaurant.heroGradient,
        },
      },
    });
  } catch (error) {
    console.error("[Restaurant Appearance Update Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la estética.",
      },
      { status: 500 }
    );
  }
}