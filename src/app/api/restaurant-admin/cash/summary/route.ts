import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";
import { summarizeCashEvents } from "@/lib/cash-summary";

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

    const todaySummary = summarizeCashEvents({
      events,
      timeZone,
    });

    const existingClosure = await prisma.cashClosure.findUnique({
      where: {
        restaurantId_businessDate: {
          restaurantId: session.restaurantId,
          businessDate: todaySummary.businessDate,
        },
      },
    });

    const lastClosures = await prisma.cashClosure.findMany({
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
    console.error("[Cash Summary Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el resumen de caja.",
      },
      { status: 500 }
    );
  }
}