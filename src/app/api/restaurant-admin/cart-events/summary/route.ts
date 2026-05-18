import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const events = await prisma.cartEvent.findMany({
      where: {
        restaurantId: session.restaurantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    const totalEvents = events.length;
    const totalEstimatedArs = events.reduce(
      (sum, event) => sum + event.totalArs,
      0
    );
    const totalItems = events.reduce((sum, event) => sum + event.itemCount, 0);
    const averageTicketArs =
      totalEvents > 0 ? Math.round(totalEstimatedArs / totalEvents) : 0;

    const lastEvents = events.slice(0, 8).map((event) => ({
      id: event.id,
      totalArs: event.totalArs,
      itemCount: event.itemCount,
      paymentMethod: event.paymentMethod,
      createdAt: event.createdAt,
    }));

    return NextResponse.json({
      ok: true,
      summary: {
        totalEvents,
        totalEstimatedArs,
        totalItems,
        averageTicketArs,
        lastEvents,
      },
    });
  } catch (error) {
    console.error("[Cart Events Summary Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el resumen de pedidos.",
      },
      { status: 500 }
    );
  }
}