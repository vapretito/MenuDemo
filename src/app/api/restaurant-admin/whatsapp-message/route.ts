import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

const DEFAULT_READY_MESSAGE =
  "Hola {customerName}, tu pedido {pickupCode} ya esta listo para retirar en {restaurantName}.";

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
    const whatsappReadyNotificationsEnabled = Boolean(
      body.whatsappReadyNotificationsEnabled
    );
    const whatsappReadyMessageTemplate = String(
      body.whatsappReadyMessageTemplate ?? ""
    ).trim();

    if (!whatsappIntroMessage) {
      return NextResponse.json(
        { error: "El mensaje inicial no puede estar vacio." },
        { status: 400 }
      );
    }

    if (whatsappReadyNotificationsEnabled && !whatsappReadyMessageTemplate) {
      return NextResponse.json(
        { error: "Defini un mensaje para avisar cuando el pedido este listo." },
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
        whatsappReadyNotificationsEnabled,
        whatsappReadyMessageTemplate:
          whatsappReadyMessageTemplate || DEFAULT_READY_MESSAGE,
      },
      select: {
        whatsappIntroMessage: true,
        whatsappFooterMessage: true,
        whatsappReadyNotificationsEnabled: true,
        whatsappReadyMessageTemplate: true,
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
            : "No se pudo guardar la configuracion de WhatsApp.",
      },
      { status: 500 }
    );
  }
}
