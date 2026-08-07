import { NextResponse } from "next/server";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteProps) {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const group = await prisma.restaurantGroup.findUnique({
    where: {
      id,
    },
    select: {
      _count: {
        select: {
          restaurants: true,
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Grupo no encontrado." }, { status: 404 });
  }

  if ((group._count.restaurants ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "No podés borrar un grupo que todavía tiene restaurantes asignados.",
      },
      { status: 400 }
    );
  }

  await prisma.restaurantGroup.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    deleted: true,
  });
}
