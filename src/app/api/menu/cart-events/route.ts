import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CartEventItemInput = {
  itemId: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const restaurantSlug = String(body.restaurantSlug ?? "").trim().toLowerCase();
    const paymentMethod = String(body.paymentMethod ?? "").trim() || "efectivo";
    const deliveryAddress = String(body.deliveryAddress ?? "").trim();
    const customerNote = String(body.customerNote ?? "").trim();

    const items = Array.isArray(body.items)
      ? (body.items as CartEventItemInput[])
      : [];

    const cleanItems = items
      .map((item) => ({
        itemId: String(item.itemId ?? "").trim(),
        quantity: Number(item.quantity ?? 0),
      }))
      .filter((item) => item.itemId && item.quantity > 0);

    if (!restaurantSlug || cleanItems.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos del restaurante o del carrito." },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        slug: restaurantSlug,
      },
      include: {
        products: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante no encontrado." },
        { status: 404 }
      );
    }

    const snapshot = cleanItems
      .map((cartItem) => {
        const product = restaurant.products.find(
          (entry) => entry.id === cartItem.itemId
        );

        if (!product) return null;

        return {
          itemId: product.id,
          name: product.name,
          priceArs: product.priceArs,
          quantity: cartItem.quantity,
          subtotalArs: product.priceArs * cartItem.quantity,
        };
      })
      .filter(Boolean) as Array<{
      itemId: string;
      name: string;
      priceArs: number;
      quantity: number;
      subtotalArs: number;
    }>;

    if (snapshot.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron productos válidos." },
        { status: 400 }
      );
    }

    const totalArs = snapshot.reduce((sum, item) => sum + item.subtotalArs, 0);
    const itemCount = snapshot.reduce((sum, item) => sum + item.quantity, 0);

    const event = await prisma.cartEvent.create({
      data: {
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        totalArs,
        itemCount,
        paymentMethod,
        deliveryAddress: deliveryAddress || null,
        customerNote: customerNote || null,
        itemsSnapshot: snapshot,
      },
    });

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      totalArs,
      itemCount,
    });
  } catch (error) {
    console.error("[Cart Event Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el carrito.",
      },
      { status: 500 }
    );
  }
}