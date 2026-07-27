import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";
import { summarizeLocalOrderCash } from "@/lib/local-order-cash-summary";

export async function GET() {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: session.restaurantId,
      },
      select: {
        timeZone: true,
      },
    });

    const timeZone = restaurant?.timeZone ?? "America/Argentina/Cordoba";

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: session.restaurantId,
        source: "LOCAL_QR",
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 800,
      include: {
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const todaySummary = summarizeLocalOrderCash({
      orders: orders.map((order) => ({
        totalArs: order.totalArs,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        status: order.status,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt,
        confirmedAt: order.confirmedAt,
      })),
      timeZone,
    });

    const existingClosure =
      todaySummary.totalOrders > 0
        ? await prisma.localCashClosure.findUnique({
            where: {
              restaurantId_businessDate: {
                restaurantId: session.restaurantId,
                businessDate: todaySummary.businessDate,
              },
            },
          })
        : null;

    const lastClosures = await prisma.localCashClosure.findMany({
      where: {
        restaurantId: session.restaurantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      ok: true,
      summary: {
        ...todaySummary,
        existingClosure,
        lastClosures,
      },
    });
  } catch (error) {
    console.error("[Local Cash Summary Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar la caja del restaurant.",
      },
      { status: 500 }
    );
  }
}
