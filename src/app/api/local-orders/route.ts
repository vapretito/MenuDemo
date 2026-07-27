import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildUnpaidExpirationDate,
  generatePickupCodeCandidate,
  isValidCustomerName,
  normalizeCustomerName,
} from "@/lib/local-ordering";

type LocalOrderItemInput = {
  itemId: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      restaurantSlug?: string;
      customerName?: string;
      customerNote?: string;
      serviceLocationToken?: string;
      items?: LocalOrderItemInput[];
    };

    const restaurantSlug = String(body.restaurantSlug ?? "").trim();
    const customerName = normalizeCustomerName(String(body.customerName ?? ""));
    const customerNote = String(body.customerNote ?? "").trim();
    const serviceLocationToken = String(body.serviceLocationToken ?? "").trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!restaurantSlug || !items.length) {
      return NextResponse.json(
        { error: "Faltan el restaurante o los productos del pedido." },
        { status: 400 }
      );
    }

    if (!isValidCustomerName(customerName)) {
      return NextResponse.json(
        { error: "Escribi un nombre valido para registrar el pedido." },
        { status: 400 }
      );
    }

    const normalizedItems = items
      .map((item) => ({
        itemId: String(item.itemId ?? "").trim(),
        quantity: Number(item.quantity ?? 0),
      }))
      .filter(
        (item) =>
          item.itemId.length > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      );

    if (!normalizedItems.length) {
      return NextResponse.json(
        { error: "No hay productos validos para registrar." },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        slug: restaurantSlug,
      },
      select: {
        id: true,
        slug: true,
        localOrderingEnabled: true,
        serviceMode: true,
        localPaymentTiming: true,
        unpaidOrderExpirationMinutes: true,
        products: {
          select: {
            id: true,
            name: true,
            priceArs: true,
            available: true,
          },
        },
        serviceLocations: serviceLocationToken
          ? {
              where: {
                publicToken: serviceLocationToken,
                isActive: true,
              },
              select: {
                id: true,
                name: true,
              },
              take: 1,
            }
          : false,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "No encontramos ese restaurante." },
        { status: 404 }
      );
    }

    if (!restaurant.localOrderingEnabled) {
      return NextResponse.json(
        { error: "Este restaurante todavia no habilito pedidos en local." },
        { status: 403 }
      );
    }

    if (
      restaurant.serviceMode === "TABLE_SERVICE" &&
      !serviceLocationToken
    ) {
      return NextResponse.json(
        { error: "Este restaurante necesita una ubicacion QR especifica." },
        { status: 400 }
      );
    }

    const serviceLocation =
      serviceLocationToken && Array.isArray(restaurant.serviceLocations)
        ? restaurant.serviceLocations[0] ?? null
        : null;

    if (serviceLocationToken && !serviceLocation) {
      return NextResponse.json(
        { error: "La ubicacion QR no es valida o ya no esta activa." },
        { status: 404 }
      );
    }

    const orderLines = normalizedItems
      .map((item) => {
        const product = restaurant.products.find(
          (entry) => entry.id === item.itemId
        );

        if (!product || !product.available) {
          return null;
        }

        return {
          productId: product.id,
          productName: product.name,
          unitPriceArs: product.priceArs,
          quantity: item.quantity,
          subtotalArs: product.priceArs * item.quantity,
        };
      })
      .filter(
        (
          item
        ): item is {
          productId: string;
          productName: string;
          unitPriceArs: number;
          quantity: number;
          subtotalArs: number;
        } => Boolean(item)
      );

    if (!orderLines.length) {
      return NextResponse.json(
        { error: "Los productos seleccionados ya no estan disponibles." },
        { status: 400 }
      );
    }

    const totalArs = orderLines.reduce(
      (sum, line) => sum + line.subtotalArs,
      0
    );
    const payBeforePreparation =
      restaurant.localPaymentTiming === "PAY_BEFORE_PREPARATION";
    const expiresAt = payBeforePreparation
      ? buildUnpaidExpirationDate(restaurant.unpaidOrderExpirationMinutes)
      : null;
    const confirmedAt = payBeforePreparation ? null : new Date();

    const order = await prisma.$transaction(async (tx) => {
      let pickupCode: string | null = null;

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidate = generatePickupCodeCandidate();
        const existingOrder = await tx.order.findFirst({
          where: {
            restaurantId: restaurant.id,
            pickupCode: candidate,
          },
          select: {
            id: true,
          },
        });

        if (!existingOrder) {
          pickupCode = candidate;
          break;
        }
      }

      if (!pickupCode) {
        throw new Error(
          "No pudimos generar un codigo de retiro unico. Intenta de nuevo."
        );
      }

      return tx.order.create({
        data: {
          restaurantId: restaurant.id,
          source: "LOCAL_QR",
          serviceMode: restaurant.serviceMode,
          serviceLocationId: serviceLocation?.id ?? null,
          customerName,
          pickupCode,
          status: payBeforePreparation ? "AWAITING_PAYMENT" : "CONFIRMED",
          paymentStatus: "PENDING",
          totalArs,
          customerNote: customerNote || null,
          confirmedAt,
          expiresAt,
          items: {
            create: orderLines.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              unitPriceArs: line.unitPriceArs,
              quantity: line.quantity,
              subtotalArs: line.subtotalArs,
            })),
          },
        },
        select: {
          id: true,
          customerName: true,
          pickupCode: true,
          status: true,
          totalArs: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      order,
    });
  } catch (error) {
    console.error("[Local Order Create Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el pedido en local.",
      },
      { status: 500 }
    );
  }
}
