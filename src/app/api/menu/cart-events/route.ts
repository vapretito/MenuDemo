import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";
import { getPostHogClient } from "@/lib/posthog-server";

type CartEventItemInput = {
  itemId: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const restaurantSlug = String(body.restaurantSlug ?? "").trim().toLowerCase();
    const customerName = String(body.customerName ?? "").trim();
    const customerWhatsapp = normalizeWhatsapp(
      String(body.customerWhatsapp ?? "").trim()
    );
    const marketingConsent = Boolean(body.marketingConsent);
    const source = String(body.source ?? "menu").trim().toLowerCase() || "menu";
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

    if (!restaurantSlug || !customerName || !customerWhatsapp || cleanItems.length === 0) {
      return NextResponse.json(
        { error: "Faltan datos del restaurante, del cliente o del carrito." },
        { status: 400 }
      );
    }

    if (!isValidWhatsapp(customerWhatsapp)) {
      return NextResponse.json(
        { error: "El WhatsApp del cliente no es valido." },
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
    const now = new Date();

    const event = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: {
          restaurantId_whatsapp: {
            restaurantId: restaurant.id,
            whatsapp: customerWhatsapp,
          },
        },
        create: {
          restaurantId: restaurant.id,
          name: customerName,
          whatsapp: customerWhatsapp,
          marketingConsent,
          marketingConsentAt: marketingConsent ? now : null,
          source,
          firstOrderAt: now,
          lastOrderAt: now,
          lastOrderTotalArs: totalArs,
          orderCount: 1,
          totalSpentArs: totalArs,
        },
        update: {
          name: customerName,
          source,
          lastOrderAt: now,
          lastOrderTotalArs: totalArs,
          orderCount: {
            increment: 1,
          },
          totalSpentArs: {
            increment: totalArs,
          },
          ...(marketingConsent
            ? {
                marketingConsent: true,
                marketingConsentAt: now,
              }
            : {}),
        },
      });

      return tx.cartEvent.create({
        data: {
          restaurantId: restaurant.id,
          restaurantSlug: restaurant.slug,
          customerId: customer.id,
          customerName,
          customerWhatsapp,
          marketingConsent,
          source,
          totalArs,
          itemCount,
          paymentMethod,
          deliveryAddress: deliveryAddress || null,
          customerNote: customerNote || null,
          itemsSnapshot: snapshot,
        },
      });
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: customerWhatsapp,
      event: "cart_event_saved",
      properties: {
        restaurant_slug: restaurant.slug,
        total_ars: totalArs,
        item_count: itemCount,
        payment_method: paymentMethod,
        source,
        has_delivery_address: Boolean(deliveryAddress),
        marketing_consent: marketingConsent,
        event_id: event.id,
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
