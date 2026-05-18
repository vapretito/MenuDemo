import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const whatsappIntroMessage = String(
      body.whatsappIntroMessage ?? ""
    ).trim();

    const whatsappFooterMessage = String(
      body.whatsappFooterMessage ?? ""
    ).trim();

    if (!whatsappIntroMessage) {
      return NextResponse.json(
        { error: "El mensaje inicial no puede estar vacío." },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.update({
      where: {
        id: session.restaurantId,
      },
      data: {
        whatsappIntroMessage,
        whatsappFooterMessage:
          whatsappFooterMessage ||
          "Por favor confirmar disponibilidad y tiempo estimado.",
      },
      select: {
        whatsappIntroMessage: true,
        whatsappFooterMessage: true,
      },
    });

    return NextResponse.json({
      ok: true,
      restaurant,
    });
  } catch (error) {
    console.error("[WhatsApp Message Update Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el mensaje de WhatsApp.",
      },
      { status: 500 }
    );
  }
}