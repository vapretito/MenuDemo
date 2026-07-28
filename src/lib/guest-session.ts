import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { GuestSessionEntryPoint } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const GUEST_SESSION_COOKIE = "menui_guest_session";
const GUEST_SESSION_TTL_HOURS = 8;

type CreateGuestSessionInput = {
  restaurantId: string;
  serviceLocationId?: string | null;
  entryPoint: GuestSessionEntryPoint;
};

const buildSessionExpirationDate = () =>
  new Date(Date.now() + GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000);

export async function createGuestSession(input: CreateGuestSessionInput) {
  const session = await prisma.guestSession.create({
    data: {
      restaurantId: input.restaurantId,
      serviceLocationId: input.serviceLocationId ?? null,
      entryPoint: input.entryPoint,
      sessionToken: randomUUID(),
      expiresAt: buildSessionExpirationDate(),
    },
    select: {
      sessionToken: true,
      expiresAt: true,
    },
  });

  return session;
}

export async function persistGuestSessionCookie(
  sessionToken: string,
  expiresAt?: Date | null
) {
  const cookieStore = await cookies();

  cookieStore.set(GUEST_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt ?? buildSessionExpirationDate(),
  });
}

export async function clearGuestSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_SESSION_COOKIE);
}

export async function getGuestSessionTokenFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_SESSION_COOKIE)?.value ?? null;
}

export async function getValidGuestSessionForRestaurant(restaurantSlug: string) {
  const sessionToken = await getGuestSessionTokenFromCookie();

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.guestSession.findUnique({
    where: {
      sessionToken,
    },
    select: {
      id: true,
      sessionToken: true,
      expiresAt: true,
      entryPoint: true,
      restaurantId: true,
      restaurant: {
        select: {
          id: true,
          slug: true,
        },
      },
      serviceLocation: {
        select: {
          id: true,
          name: true,
          publicToken: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  const isExpired =
    session.expiresAt instanceof Date && session.expiresAt.getTime() <= Date.now();
  const isRestaurantMismatch = session.restaurant.slug !== restaurantSlug;
  const isInactiveLocation =
    session.serviceLocation !== null && session.serviceLocation.isActive === false;

  if (isExpired || isRestaurantMismatch || isInactiveLocation) {
    await clearGuestSessionCookie();
    return null;
  }

  return session;
}
