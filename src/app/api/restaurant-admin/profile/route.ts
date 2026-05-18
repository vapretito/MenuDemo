import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const city = String(body.city ?? "").trim();
    const cuisine = String(body.cuisine ?? "").trim();
    const customerWhatsapp = String(body.customerWhatsapp ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!name || !city || !cuisine || !customerWhatsapp || !description) {
      return NextResponse.json(
        {
          error:
            "Completá nombre, ciudad, tipo de cocina, WhatsApp y descripción.",
        },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.update({
      where: {
        id: session.restaurantId,
      },
      data: {
        name,
        city,
        cuisine,
        customerWhatsapp,
        adminWhatsapp: customerWhatsapp,
        description,
      },
      select: {
        id: true,
        name: true,
        city: true,
        cuisine: true,
        customerWhatsapp: true,
        adminWhatsapp: true,
        description: true,
      },
    });

    return NextResponse.json({
      ok: true,
      restaurant,
    });
  } catch (error) {
    console.error("[Restaurant Profile Update Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron guardar los datos del restaurante.",
      },
      { status: 500 }
    );
  }
}