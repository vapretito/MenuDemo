import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteProps) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const event = await prisma.cartEvent.findFirst({
      where: {
        id,
        restaurantId: session.restaurantId,
      },
      select: {
        id: true,
        customerId: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Pedido no encontrado." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.cartEvent.delete({
        where: {
          id,
        },
      });

      if (!event.customerId) {
        return;
      }

      const remainingEvents = await tx.cartEvent.findMany({
        where: {
          customerId: event.customerId,
          restaurantId: session.restaurantId,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          createdAt: true,
          totalArs: true,
          marketingConsent: true,
          source: true,
        },
      });

      if (!remainingEvents.length) {
        await tx.customer.delete({
          where: {
            id: event.customerId,
          },
        });
        return;
      }

      const lastEvent = remainingEvents[remainingEvents.length - 1];

      await tx.customer.update({
        where: {
          id: event.customerId,
        },
        data: {
          firstOrderAt: remainingEvents[0].createdAt,
          lastOrderAt: lastEvent.createdAt,
          lastOrderTotalArs: lastEvent.totalArs,
          orderCount: remainingEvents.length,
          totalSpentArs: remainingEvents.reduce(
            (sum, entry) => sum + entry.totalArs,
            0
          ),
          marketingConsent: remainingEvents.some((entry) => entry.marketingConsent),
          source: lastEvent.source,
        },
      });
    });

    return NextResponse.json({
      deleted: true,
    });
  } catch (error) {
    console.error("[Delete Cart Event Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo borrar el pedido.",
      },
      { status: 500 }
    );
  }
}
