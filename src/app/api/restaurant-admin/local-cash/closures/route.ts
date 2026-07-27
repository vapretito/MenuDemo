import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";
import { summarizeLocalOrderCash } from "@/lib/local-order-cash-summary";

export async function POST(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const notes = String(body.notes ?? "").trim();

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

    const summary = summarizeLocalOrderCash({
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

    if (summary.totalOrders === 0) {
      return NextResponse.json(
        {
          error:
            "No hay pedidos visibles pagados en el historial para cerrar la caja del restaurant.",
        },
        { status: 400 }
      );
    }

    const closure = await prisma.localCashClosure.upsert({
      where: {
        restaurantId_businessDate: {
          restaurantId: session.restaurantId,
          businessDate: summary.businessDate,
        },
      },
      create: {
        restaurantId: session.restaurantId,
        businessDate: summary.businessDate,
        timeZone,
        totalOrders: summary.totalOrders,
        totalPaidArs: summary.totalPaidArs,
        totalItems: summary.totalItems,
        averageTicketArs: summary.averageTicketArs,
        statusBreakdown: summary.statusBreakdown as unknown as Prisma.InputJsonValue,
        notes: notes || null,
      },
      update: {
        timeZone,
        totalOrders: summary.totalOrders,
        totalPaidArs: summary.totalPaidArs,
        totalItems: summary.totalItems,
        averageTicketArs: summary.averageTicketArs,
        statusBreakdown: summary.statusBreakdown as unknown as Prisma.InputJsonValue,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      ok: true,
      closure,
    });
  } catch (error) {
    console.error("[Local Cash Closure Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cerrar la caja del restaurant.",
      },
      { status: 500 }
    );
  }
}
