import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: session.restaurantId,
        source: "LOCAL_QR",
      },
      include: {
        serviceLocation: {
          select: {
            name: true,
          },
        },
        items: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            productName: true,
            quantity: true,
            subtotalArs: true,
            notes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const visibleOrders = orders.filter((order) => !order.deletedAt);

    const awaitingPayment = visibleOrders.filter(
      (order) => order.status === "AWAITING_PAYMENT"
    );
    const active = visibleOrders.filter(
      (order) => order.status === "CONFIRMED" || order.status === "PREPARING"
    );
    const ready = visibleOrders.filter((order) => order.status === "READY");
    const recent = visibleOrders.filter((order) =>
      ["DELIVERED", "EXPIRED", "CANCELLED"].includes(order.status)
    );

    return NextResponse.json({
      ok: true,
      summary: {
        awaitingPaymentCount: awaitingPayment.length,
        activeCount: active.length,
        readyCount: ready.length,
        awaitingPayment,
        active,
        ready,
        recent: recent.slice(0, 10),
        history: visibleOrders,
      },
    });
  } catch (error) {
    console.error("[Restaurant Local Orders Summary Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los pedidos en local.",
      },
      { status: 500 }
    );
  }
}
