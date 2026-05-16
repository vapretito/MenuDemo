import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function mapProduct(product: {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceArs: number;
  image: string | null;
  featured: boolean;
  available: boolean;
  prepTime: string;
}) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    price: product.priceArs,
    image: product.image ?? "",
    featured: product.featured,
    available: product.available,
    prepTime: product.prepTime,
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

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        restaurantId: session.restaurantId,
      },
      select: {
        id: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const categoryId = String(body.categoryId ?? "").trim();
    const prepTime = String(body.prepTime ?? "").trim();
    const image = String(body.image ?? "").trim();
    const priceArs = Number(body.price ?? 0);

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "Faltan nombre o categoría." },
        { status: 400 }
      );
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        restaurantId: session.restaurantId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría inválida." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        categoryId,
        prepTime: prepTime || "15 min",
        image: image || null,
        priceArs: Number.isFinite(priceArs) ? priceArs : 0,
        featured: Boolean(body.featured),
        available: Boolean(body.available),
      },
    });

    return NextResponse.json({
      product: mapProduct(product),
    });
  } catch (error) {
    console.error("[Update Product Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el producto.",
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

    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        restaurantId: session.restaurantId,
      },
      select: {
        id: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      deleted: true,
    });
  } catch (error) {
    console.error("[Delete Product Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo borrar el producto.",
      },
      { status: 500 }
    );
  }
}