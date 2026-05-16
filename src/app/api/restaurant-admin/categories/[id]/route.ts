import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(request: Request, { params }: RouteProps) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre de la categoría es obligatorio." },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        restaurantId: session.restaurantId,
      },
      select: {
        id: true,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada." },
        { status: 404 }
      );
    }

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name,
        description:
          description || "Nueva categoría lista para ordenar productos.",
      },
    });

    return NextResponse.json({
      category: mapCategory(category),
    });
  } catch (error) {
    console.error("[Update Category Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la categoría.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const categoriesCount = await prisma.category.count({
      where: {
        restaurantId: session.restaurantId,
      },
    });

    if (categoriesCount <= 1) {
      return NextResponse.json(
        { error: "No podés eliminar la única categoría del menú." },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        restaurantId: session.restaurantId,
      },
      select: {
        id: true,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Categoría no encontrada." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.product.deleteMany({
        where: {
          categoryId: id,
          restaurantId: session.restaurantId,
        },
      }),
      prisma.category.delete({
        where: {
          id,
        },
      }),
    ]);

    return NextResponse.json({
      deleted: true,
    });
  } catch (error) {
    console.error("[Delete Category Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo borrar la categoría.",
      },
      { status: 500 }
    );
  }
}