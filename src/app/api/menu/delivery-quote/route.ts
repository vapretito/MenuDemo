import { NextResponse } from "next/server";
import { getDeliveryRouteDistanceMeters } from "@/lib/delivery-distance";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const restaurantSlug = String(body.restaurantSlug ?? "").trim().toLowerCase();
    const destinationAddress = String(body.destinationAddress ?? "").trim();

    if (!restaurantSlug || !destinationAddress) {
      return NextResponse.json({ error: "Completá la dirección de entrega." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      select: {
        address: true,
        city: true,
        deliveryFeeMode: true,
        deliveryFeeFixedArs: true,
        deliveryFeePerKmArs: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante no encontrado." }, { status: 404 });
    }

    if (restaurant.deliveryFeeMode === "FIXED") {
      return NextResponse.json({
        deliveryFeeArs: restaurant.deliveryFeeFixedArs,
        distanceMeters: null,
      });
    }

    if (!restaurant.address?.trim()) {
      return NextResponse.json(
        { error: "El restaurante todavía no configuró su dirección." },
        { status: 400 }
      );
    }

    const distanceMeters = await getDeliveryRouteDistanceMeters({
      originAddress: `${restaurant.address}, ${restaurant.city}`,
      destinationAddress,
    });
    const deliveryFeeArs = Math.ceil(distanceMeters / 1000) * restaurant.deliveryFeePerKmArs;

    return NextResponse.json({ deliveryFeeArs, distanceMeters });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo calcular el delivery." },
      { status: 500 }
    );
  }
}
