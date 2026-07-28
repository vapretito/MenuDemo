import { NextResponse } from "next/server";
import { GuestSessionEntryPoint } from "@/generated/prisma/client";
import { createGuestSession, persistGuestSessionCookie } from "@/lib/guest-session";
import { prisma } from "@/lib/prisma";
import { canRestaurantAccessPanel } from "@/lib/restaurant-access";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
      status: true,
      trialEndsAt: true,
      graceUntil: true,
    },
  });

  if (!restaurant) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!canRestaurantAccessPanel(restaurant)) {
    return NextResponse.redirect(new URL(`/activar/${restaurant.slug}`, request.url));
  }

  const session = await createGuestSession({
    restaurantId: restaurant.id,
    entryPoint: GuestSessionEntryPoint.GENERAL_QR,
  });

  await persistGuestSessionCookie(session.sessionToken, session.expiresAt);

  return NextResponse.redirect(new URL(`/ordenar/${restaurant.slug}`, request.url));
}
