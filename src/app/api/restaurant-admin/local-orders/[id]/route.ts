import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";
import {
  buildLocalOrderStatusPushBody,
  sendLocalOrderPushNotifications,
} from "@/lib/web-push";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      action?: "confirm_payment" | "mark_preparing" | "mark_ready" | "mark_delivered";
    };

    const action = body.action;

    if (!action) {
      return NextResponse.json(
        { error: "Falta la accion a ejecutar." },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: session.restaurantId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paidAt: true,
        pickupCode: true,
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "No encontramos ese pedido." },
        { status: 404 }
      );
    }

    const data: {
      paymentStatus?: "PAID";
      status?: "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED";
      confirmedAt?: Date;
      paidAt?: Date;
    } = {};

    if (action === "confirm_payment") {
      if (
        existingOrder.status === "EXPIRED" ||
        existingOrder.status === "CANCELLED"
      ) {
        return NextResponse.json(
          { error: "No se puede confirmar un pedido vencido o cancelado." },
          { status: 400 }
        );
      }

      data.paymentStatus = "PAID";
      if (!existingOrder.paidAt) {
        data.paidAt = new Date();
      }
      if (existingOrder.status === "AWAITING_PAYMENT") {
        data.status = "CONFIRMED";
        data.confirmedAt = new Date();
      }
    }

    if (action === "mark_preparing") {
      if (existingOrder.status !== "CONFIRMED") {
        return NextResponse.json(
          { error: "Solo se puede pasar a preparacion desde confirmado." },
          { status: 400 }
        );
      }

      data.status = "PREPARING";
    }

    if (action === "mark_ready") {
      if (existingOrder.status !== "PREPARING") {
        return NextResponse.json(
          { error: "Solo se puede marcar listo desde preparacion." },
          { status: 400 }
        );
      }

      data.status = "READY";
    }

    if (action === "mark_delivered") {
      if (existingOrder.status !== "READY") {
        return NextResponse.json(
          { error: "Solo se puede marcar entregado desde listo." },
          { status: 400 }
        );
      }

      data.status = "DELIVERED";
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        status: true,
      },
    });

    if (updatedOrder.status !== existingOrder.status) {
      await sendLocalOrderPushNotifications({
        orderId: updatedOrder.id,
        title: existingOrder.restaurant.name,
        body: buildLocalOrderStatusPushBody({
          status: updatedOrder.status,
          pickupCode: existingOrder.pickupCode,
          restaurantName: existingOrder.restaurant.name,
        }),
        tag: `local-order-${updatedOrder.id}`,
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("[Restaurant Local Order Update Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el pedido en local.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const requestBody = (await request.json().catch(() => ({}))) as {
      deleteCode?: string;
    };
    const deleteCode = String(requestBody.deleteCode ?? "").trim();

    const existingOrder = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: session.restaurantId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "No encontramos ese pedido." },
        { status: 404 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: session.restaurantId,
      },
      select: {
        localOrderDeletionCodeHash: true,
      },
    });

    if (!restaurant?.localOrderDeletionCodeHash) {
      return NextResponse.json(
        {
          error:
            "Primero configura un codigo de borrado en la seccion Seguridad.",
        },
        { status: 400 }
      );
    }

    if (!deleteCode) {
      return NextResponse.json(
        { error: "Ingresa el codigo de borrado para continuar." },
        { status: 400 }
      );
    }

    const isDeleteCodeValid = verifyPassword(
      deleteCode,
      restaurant.localOrderDeletionCodeHash
    );

    if (!isDeleteCodeValid) {
      return NextResponse.json(
        { error: "El codigo de borrado es incorrecto." },
        { status: 401 }
      );
    }

    await prisma.order.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        deletedByAdmin: true,
      },
    });

    return NextResponse.json({
      ok: true,
      deleted: true,
    });
  } catch (error) {
    console.error("[Restaurant Local Order Delete Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo borrar el pedido en local.",
      },
      { status: 500 }
    );
  }
}
