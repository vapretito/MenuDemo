import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

type ReorderProductsBody = {
  categoryId?: unknown;
  productIds?: unknown;
};

export async function PATCH(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ReorderProductsBody;

    const categoryId = String(body.categoryId ?? "").trim();

    const rawProductIds = Array.isArray(body.productIds)
      ? body.productIds
      : [];

    const productIds = rawProductIds
      .map((id: unknown) => String(id).trim())
      .filter(Boolean);

    if (!categoryId || !productIds.length) {
      return NextResponse.json(
        { error: "No se recibieron productos para ordenar." },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        restaurantId: session.restaurantId,
        categoryId,
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Hay productos inválidos para esta categoría." },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      productIds.map((productId: string, index: number) =>
        prisma.product.update({
          where: {
            id: productId,
          },
          data: {
            sortOrder: index + 1,
          },
        })
      )
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("[Reorder Products Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron ordenar los productos.",
      },
      { status: 500 }
    );
  }
}