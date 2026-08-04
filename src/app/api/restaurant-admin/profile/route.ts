import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";
import { RestaurantFulfillmentMode } from "@/generated/prisma/client";

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
    const address = String(body.address ?? "").trim();
    const googleMapsUrl = String(body.googleMapsUrl ?? "").trim();
    const instagramUrl = String(body.instagramUrl ?? "").trim();
    const deliveryZones = String(body.deliveryZones ?? "").trim();
    const deliveryTimeEstimate = String(body.deliveryTimeEstimate ?? "").trim();
    const fulfillmentModeInput = String(body.fulfillmentMode ?? "").trim();
    const fulfillmentMode =
      fulfillmentModeInput === "TAKEAWAY_ONLY" ||
      fulfillmentModeInput === "DELIVERY_AND_TAKEAWAY" ||
      fulfillmentModeInput === "DELIVERY_ONLY"
        ? (fulfillmentModeInput as RestaurantFulfillmentMode)
        : RestaurantFulfillmentMode.DELIVERY_ONLY;

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
        address: address || null,
        googleMapsUrl: googleMapsUrl || null,
        instagramUrl: instagramUrl || null,
        deliveryZones: deliveryZones || null,
        deliveryTimeEstimate: deliveryTimeEstimate || null,
        fulfillmentMode,
      },
      select: {
        id: true,
        name: true,
        city: true,
        cuisine: true,
        customerWhatsapp: true,
        adminWhatsapp: true,
        description: true,
        address: true,
        googleMapsUrl: true,
        instagramUrl: true,
        deliveryZones: true,
        deliveryTimeEstimate: true,
        fulfillmentMode: true,
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
