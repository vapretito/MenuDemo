import { NextResponse } from "next/server";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      feedback: feedback.map((entry) => ({
        id: entry.id,
        restaurantId: entry.restaurant.id,
        restaurantName: entry.restaurant.name,
        restaurantSlug: entry.restaurant.slug,
        message: entry.message,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[Backoffice Feedback Load Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el feedback.",
      },
      { status: 500 }
    );
  }
}
