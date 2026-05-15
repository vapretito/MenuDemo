import { NextResponse } from "next/server";
import { DnsStatus, RestaurantStatus } from "@/generated/prisma/client";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import { prisma } from "@/lib/prisma";
import { mapRestaurantToRecord } from "@/lib/restaurant-mapper";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const statusMap: Record<string, RestaurantStatus> = {
  trial: RestaurantStatus.TRIAL,
  active: RestaurantStatus.ACTIVE,
  past_due: RestaurantStatus.PAST_DUE,
  suspended: RestaurantStatus.SUSPENDED,
  cancelled: RestaurantStatus.CANCELLED,
  manual: RestaurantStatus.MANUAL,
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const data: {
    status?: RestaurantStatus;
    dnsStatus?: DnsStatus;
    graceUntil?: Date | null;
  } = {};

  if (body.status) {
    const nextStatus = statusMap[String(body.status)];

    if (!nextStatus) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    data.status = nextStatus;
    data.graceUntil =
      nextStatus === RestaurantStatus.PAST_DUE
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : null;
  }

  if (body.dnsStatus === "configured") {
    data.dnsStatus = DnsStatus.CONFIGURED;
  }

  if (body.dnsStatus === "pending") {
    data.dnsStatus = DnsStatus.PENDING;
  }

  const restaurant = await prisma.restaurant.update({
    where: {
      id,
    },
    data,
    include: {
      categories: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      products: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      subscription: true,
    },
  });

  return NextResponse.json({
    restaurant: mapRestaurantToRecord(restaurant),
  });
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id,
    },
    select: {
      connectedToDemo: true,
    },
  });

  if (!restaurant) {
    return NextResponse.json(
      { error: "Restaurante no encontrado." },
      { status: 404 }
    );
  }

  if (restaurant.connectedToDemo) {
    return NextResponse.json(
      { error: "No podés borrar el restaurante demo." },
      { status: 403 }
    );
  }

  await prisma.restaurant.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    deleted: true,
  });
}