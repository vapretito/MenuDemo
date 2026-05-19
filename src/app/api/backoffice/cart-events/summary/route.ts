import { NextResponse } from "next/server";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const events = await prisma.cartEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            subdomain: true,
          },
        },
      },
    });

    const totalEvents = events.length;

    const totalEstimatedArs = events.reduce(
      (sum, event) => sum + event.totalArs,
      0
    );

    const totalItems = events.reduce((sum, event) => sum + event.itemCount, 0);

    const averageTicketArs =
      totalEvents > 0 ? Math.round(totalEstimatedArs / totalEvents) : 0;

    const byRestaurantMap = new Map<
      string,
      {
        restaurantId: string;
        restaurantName: string;
        restaurantSlug: string;
        subdomain: string;
        totalEvents: number;
        totalEstimatedArs: number;
        totalItems: number;
      }
    >();

    for (const event of events) {
      const current = byRestaurantMap.get(event.restaurantId);

      if (current) {
        current.totalEvents += 1;
        current.totalEstimatedArs += event.totalArs;
        current.totalItems += event.itemCount;
      } else {
        byRestaurantMap.set(event.restaurantId, {
          restaurantId: event.restaurantId,
          restaurantName: event.restaurant?.name ?? event.restaurantSlug,
          restaurantSlug: event.restaurantSlug,
          subdomain: event.restaurant?.subdomain ?? "",
          totalEvents: 1,
          totalEstimatedArs: event.totalArs,
          totalItems: event.itemCount,
        });
      }
    }

    const byRestaurant = Array.from(byRestaurantMap.values()).sort(
      (a, b) => b.totalEstimatedArs - a.totalEstimatedArs
    );

    const lastEvents = events.slice(0, 10).map((event) => ({
      id: event.id,
      restaurantName: event.restaurant?.name ?? event.restaurantSlug,
      restaurantSlug: event.restaurantSlug,
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
        byRestaurant,
        lastEvents,
      },
    });
  } catch (error) {
    console.error("[Backoffice Cart Summary Error]", error);

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