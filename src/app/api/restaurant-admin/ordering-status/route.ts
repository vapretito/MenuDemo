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

    const isAcceptingOrders = Boolean(body.isAcceptingOrders);
    const closedMessage =
      String(body.closedMessage ?? "").trim() ||
      "Estamos cerrados por ahora. Podés revisar el menú y consultarnos por WhatsApp.";

    const restaurant = await prisma.restaurant.update({
      where: {
        id: session.restaurantId,
      },
      data: {
        isAcceptingOrders,
        closedMessage,
      },
      select: {
        isAcceptingOrders: true,
        closedMessage: true,
      },
    });

    return NextResponse.json({
      ok: true,
      restaurant,
    });
  } catch (error) {
    console.error("[Ordering Status Update Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el estado del restaurante.",
      },
      { status: 500 }
    );
  }
}