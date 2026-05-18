import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Completá contraseña actual, nueva contraseña y confirmación." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "La nueva contraseña y la confirmación no coinciden." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        restaurantId: session.restaurantId,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta." },
        { status: 401 }
      );
    }

    const nextPasswordHash = hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: nextPasswordHash,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    console.error("[Change Password Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cambiar la contraseña.",
      },
      { status: 500 }
    );
  }
}