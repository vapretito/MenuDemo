import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/client";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { canRestaurantAccessPanel } from "@/lib/restaurant-access";
import {
  createRestaurantSessionToken,
  setRestaurantSessionCookie,
} from "@/lib/restaurant-session";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const slug = String(body.slug ?? "").trim().toLowerCase();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!slug || !email || !password) {
      return NextResponse.json(
        { error: "Faltan slug, email o contraseña." },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
        slug: true,
        subdomain: true,
        status: true,
        name: true,
        trialEndsAt: true,
        graceUntil: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante no encontrado." },
        { status: 404 }
      );
    }

    if (!canRestaurantAccessPanel(restaurant)) {
      return NextResponse.json(
        {
          error:
            "El restaurante no tiene acceso habilitado. Regularizá la membresía para ingresar.",
          activationUrl: `https://${restaurant.subdomain}/activar/${restaurant.slug}`,
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
        restaurantId: restaurant.id,
        role: UserRole.RESTAURANT_ADMIN,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        restaurantId: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const validPassword = verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const token = createRestaurantSessionToken({
      userId: user.id,
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      role: "RESTAURANT_ADMIN",
    });

    await setRestaurantSessionCookie(token);

    const posthog = getPostHogClient();
    posthog.identify({
      distinctId: user.email,
      properties: {
        email: user.email,
        restaurant_id: restaurant.id,
        restaurant_slug: restaurant.slug,
        restaurant_name: restaurant.name,
        role: user.role,
      },
    });
    posthog.capture({
      distinctId: user.email,
      event: "restaurant_admin_login",
      properties: {
        restaurant_id: restaurant.id,
        restaurant_slug: restaurant.slug,
        restaurant_name: restaurant.name,
        restaurant_status: restaurant.status,
      },
    });

    return NextResponse.json({
      ok: true,
      redirectTo: `https://${restaurant.subdomain}/admin`,
    });
  } catch (error) {
    console.error("[Restaurant Login Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar sesión.",
      },
      { status: 500 }
    );
  }
}
