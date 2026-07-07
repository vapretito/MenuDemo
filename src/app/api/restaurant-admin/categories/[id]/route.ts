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
  hidden: boolean;
}) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    hidden: category.hidden,
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
        { error: "El nombre de la categoria es obligatorio." },
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
        { error: "Categoria no encontrada." },
        { status: 404 }
      );
    }

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name,
        description: description || "Nueva categoria lista para ordenar productos.",
        hidden: Boolean(body.hidden),
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
            : "No se pudo guardar la categoria.",
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
        { error: "No podes eliminar la unica categoria del menu." },
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
        { error: "Categoria no encontrada." },
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
            : "No se pudo borrar la categoria.",
      },
      { status: 500 }
    );
  }
}
