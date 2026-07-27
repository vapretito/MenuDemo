import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const { searchParams } = new URL(request.url);
    const slug = String(searchParams.get("slug") ?? "").trim();

    if (!slug) {
      return NextResponse.json(
        { error: "Falta el restaurante del pedido." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurant: {
          slug,
        },
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        customerName: true,
        pickupCode: true,
        totalArs: true,
        confirmedAt: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No encontramos ese pedido." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      order,
    });
  } catch (error) {
    console.error("[Public Local Order Status Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo consultar el estado del pedido.",
      },
      { status: 500 }
    );
  }
}
