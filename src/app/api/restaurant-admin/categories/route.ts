import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

function mapCategory(category: {
  id: string;
  name: string;
  description: string;
}) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
  };
}

export async function POST(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const description =
      String(body.description ?? "").trim() ||
      "Nueva categoría lista para ordenar productos.";

    if (!name) {
      return NextResponse.json(
        { error: "El nombre de la categoría es obligatorio." },
        { status: 400 }
      );
    }

    const lastCategory = await prisma.category.findFirst({
      where: {
        restaurantId: session.restaurantId,
      },
      orderBy: {
        sortOrder: "desc",
      },
      select: {
        sortOrder: true,
      },
    });

    const category = await prisma.category.create({
      data: {
        restaurantId: session.restaurantId,
        name,
        description,
        sortOrder: (lastCategory?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({
      category: mapCategory(category),
    });
  } catch (error) {
    console.error("[Create Category Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la categoría.",
      },
      { status: 500 }
    );
  }
}