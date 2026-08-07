import { NextResponse } from "next/server";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import { prisma } from "@/lib/prisma";
import { mapRestaurantGroupRecord } from "@/lib/restaurant-groups";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function GET() {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const groups = await prisma.restaurantGroup.findMany({
    orderBy: {
      createdAt: "asc",
    },
    include: {
      _count: {
        select: {
          restaurants: true,
        },
      },
    },
  });

  return NextResponse.json({
    groups: groups.map(mapRestaurantGroupRecord),
  });
}

export async function POST(request: Request) {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const rawSlug = String(body.slug ?? "").trim();
    const description = String(body.description ?? "").trim();
    const accentColor = String(body.accentColor ?? "#1d4ed8").trim() || "#1d4ed8";
    const slug = slugify(rawSlug || name);

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Completá al menos nombre y slug del grupo." },
        { status: 400 }
      );
    }

    const exists = await prisma.restaurantGroup.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Ya existe un grupo con ese slug." },
        { status: 409 }
      );
    }

    const group = await prisma.restaurantGroup.create({
      data: {
        name,
        slug,
        description,
        accentColor,
      },
      include: {
        _count: {
          select: {
            restaurants: true,
          },
        },
      },
    });

    return NextResponse.json({
      group: mapRestaurantGroupRecord(group),
    });
  } catch (error) {
    console.error("[Backoffice Create Group Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo crear el grupo.",
      },
      { status: 500 }
    );
  }
}
