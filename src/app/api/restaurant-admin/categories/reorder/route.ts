import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

type ReorderCategoriesBody = {
  categoryIds?: unknown;
};

export async function PATCH(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ReorderCategoriesBody;

    const rawCategoryIds = Array.isArray(body.categoryIds)
      ? body.categoryIds
      : [];

    const categoryIds = rawCategoryIds
      .map((id: unknown) => String(id).trim())
      .filter(Boolean);

    if (!categoryIds.length) {
      return NextResponse.json(
        { error: "No se recibieron categorías para ordenar." },
        { status: 400 }
      );
    }

    const categories = await prisma.category.findMany({
      where: {
        restaurantId: session.restaurantId,
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "Hay categorías inválidas para este restaurante." },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      categoryIds.map((categoryId: string, index: number) =>
        prisma.category.update({
          where: {
            id: categoryId,
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
    console.error("[Reorder Categories Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron ordenar las categorías.",
      },
      { status: 500 }
    );
  }
}