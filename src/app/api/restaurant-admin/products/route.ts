import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

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

export async function POST(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const categoryId = String(body.categoryId ?? "").trim();

    if (!categoryId) {
      return NextResponse.json(
        { error: "Falta la categoría del producto." },
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
        { error: "Categoría no encontrada." },
        { status: 404 }
      );
    }

    const lastProduct = await prisma.product.findFirst({
      where: {
        restaurantId: session.restaurantId,
        categoryId,
      },
      orderBy: {
        sortOrder: "desc",
      },
      select: {
        sortOrder: true,
      },
    });

    const name = String(body.name ?? "Nuevo producto").trim();
    const description = String(
      body.description ?? "Descripción breve del producto para el menú."
    ).trim();
    
    const image = String(body.image ?? "").trim();
    const prepTime = String(body.prepTime ?? "15 min").trim();
    const priceArs = Number(body.price ?? 0);
    
    const product = await prisma.product.create({
      data: {
        restaurantId: session.restaurantId,
        categoryId,
        name: name || "Nuevo producto",
        description:
          description || "Descripción breve del producto para el menú.",
        priceArs: Number.isFinite(priceArs) ? priceArs : 0,
        image: image || null,
        prepTime: prepTime || "15 min",
        featured: Boolean(body.featured),
        available:
          typeof body.available === "boolean" ? body.available : true,
        sortOrder: (lastProduct?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({
      product: mapProduct(product),
    });
  } catch (error) {
    console.error("[Create Product Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el producto.",
      },
      { status: 500 }
    );
  }
}