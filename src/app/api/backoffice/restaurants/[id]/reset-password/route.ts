import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/client";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import { generateTemporaryPassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        adminName: true,
        users: {
          where: {
            role: UserRole.RESTAURANT_ADMIN,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            email: true,
          },
          take: 1,
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurante no encontrado." },
        { status: 404 }
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const fallbackEmail = `demo+${restaurant.slug}@menui.online`;
    const adminUser = restaurant.users[0]
      ? restaurant.users[0]
      : await prisma.user.create({
          data: {
            name: restaurant.adminName?.trim() || `Admin ${restaurant.name}`,
            email: fallbackEmail,
            passwordHash: hashPassword(temporaryPassword),
            role: UserRole.RESTAURANT_ADMIN,
            restaurantId: restaurant.id,
          },
          select: {
            id: true,
            email: true,
          },
        });

    if (restaurant.users[0]) {
      await prisma.user.update({
        where: {
          id: adminUser.id,
        },
        data: {
          passwordHash: hashPassword(temporaryPassword),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      credentials: {
        restaurantName: restaurant.name,
        email: adminUser.email,
        temporaryPassword,
        loginUrl: `https://${restaurant.subdomain}/login`,
      },
      message:
        "Contrasena temporal generada. Compartila con el cliente para que ingrese y la cambie desde su admin.",
    });
  } catch (error) {
    console.error("[Backoffice Reset Password Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo restablecer la contrasena.",
      },
      { status: 500 }
    );
  }
}
