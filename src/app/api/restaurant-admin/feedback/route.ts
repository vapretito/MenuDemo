import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const message = String(body.message ?? "").trim();

    if (message.length < 10) {
      return NextResponse.json(
        {
          error: "Escribí un mensaje un poco más completo para enviar el feedback.",
        },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        restaurantId: session.restaurantId,
        message,
      },
      select: {
        id: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      feedback: {
        ...feedback,
        createdAt: feedback.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Restaurant Feedback Create Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el feedback.",
      },
      { status: 500 }
    );
  }
}
