import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

type OpeningHourInput = {
  day?: string;
  label?: string;
  enabled?: boolean;
  openTime?: string;
  closeTime?: string;
};

export async function PATCH(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const openingHours = Array.isArray(body.openingHours)
      ? (body.openingHours as OpeningHourInput[])
      : [];

    const cleanOpeningHours = openingHours.map((hour) => ({
      day: String(hour.day ?? "").trim(),
      label: String(hour.label ?? "").trim(),
      enabled: Boolean(hour.enabled),
      openTime: String(hour.openTime ?? "").trim(),
      closeTime: String(hour.closeTime ?? "").trim(),
    }));

    

    const openingHoursNote =
      String(body.openingHoursNote ?? "").trim() ||
      "Horarios sujetos a disponibilidad del restaurante.";

      const showOpeningHours =
      typeof body.showOpeningHours === "boolean"
        ? body.showOpeningHours
        : true;
        const timeZone =
  String(body.timeZone ?? "").trim() || "America/Argentina/Cordoba";
    
const restaurant = await prisma.restaurant.update({
  where: {
    id: session.restaurantId,
  },
  data: {
    openingHours: cleanOpeningHours as unknown as Prisma.InputJsonValue,
    openingHoursNote,
    showOpeningHours,
    timeZone,
  },
  select: {
    openingHours: true,
    openingHoursNote: true,
    showOpeningHours: true,
    timeZone: true,
  },
});

    return NextResponse.json({
      ok: true,
      restaurant,
    });
  } catch (error) {
    console.error("[Opening Hours Update Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron guardar los horarios.",
      },
      { status: 500 }
    );
  }
}