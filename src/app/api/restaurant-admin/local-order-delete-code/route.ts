import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const deleteCode = String(body.deleteCode ?? "").trim();
    const confirmDeleteCode = String(body.confirmDeleteCode ?? "").trim();

    if (!deleteCode || !confirmDeleteCode) {
      return NextResponse.json(
        { error: "Completá el código de borrado y su confirmación." },
        { status: 400 }
      );
    }

    if (deleteCode.length < 4) {
      return NextResponse.json(
        { error: "El código de borrado debe tener al menos 4 caracteres." },
        { status: 400 }
      );
    }

    if (deleteCode !== confirmDeleteCode) {
      return NextResponse.json(
        { error: "El código de borrado y la confirmación no coinciden." },
        { status: 400 }
      );
    }

    await prisma.restaurant.update({
      where: {
        id: session.restaurantId,
      },
      data: {
        localOrderDeletionCodeHash: hashPassword(deleteCode),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Código de borrado actualizado correctamente.",
    });
  } catch (error) {
    console.error("[Local Order Delete Code Update Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el código de borrado.",
      },
      { status: 500 }
    );
  }
}
