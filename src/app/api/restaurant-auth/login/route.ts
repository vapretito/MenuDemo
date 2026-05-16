import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/client";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  createRestaurantSessionToken,
  setRestaurantSessionCookie,
} from "@/lib/restaurant-session";

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
        status: true,
        name: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante no encontrado." },
        { status: 404 }
      );
    }

    if (restaurant.status !== "ACTIVE" && restaurant.slug !== "demo") {
      return NextResponse.json(
        {
          error:
            "El restaurante todavía no está activo. Completá el pago para ingresar.",
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

    return NextResponse.json({
      ok: true,
      redirectTo: "/admin",
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