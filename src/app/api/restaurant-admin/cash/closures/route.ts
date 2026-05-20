import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { summarizeCashEvents } from "@/lib/cash-summary";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

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

    const events = await prisma.cartEvent.findMany({
      where: {
        restaurantId: session.restaurantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 800,
      select: {
        totalArs: true,
        itemCount: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    const summary = summarizeCashEvents({
      events,
      timeZone,
    });

    const closure = await prisma.cashClosure.upsert({
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
        totalEvents: summary.totalEvents,
        totalEstimatedArs: summary.totalEstimatedArs,
        totalItems: summary.totalItems,
        averageTicketArs: summary.averageTicketArs,
        paymentBreakdown:
          summary.paymentBreakdown as unknown as Prisma.InputJsonValue,
        notes: notes || null,
      },
      update: {
        timeZone,
        totalEvents: summary.totalEvents,
        totalEstimatedArs: summary.totalEstimatedArs,
        totalItems: summary.totalItems,
        averageTicketArs: summary.averageTicketArs,
        paymentBreakdown:
          summary.paymentBreakdown as unknown as Prisma.InputJsonValue,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      ok: true,
      closure,
    });
  } catch (error) {
    console.error("[Cash Closure Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cerrar la caja.",
      },
      { status: 500 }
    );
  }
}