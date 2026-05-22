import { NextRequest, NextResponse } from "next/server";
import {
  RestaurantStatus,
  SubscriptionStatus,
} from "@/generated/prisma/client";
import { getMercadoPagoPreapproval } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

function normalizeStatus(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function mapPreapprovalToSubscriptionStatus(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "authorized") {
    return SubscriptionStatus.AUTHORIZED;
  }

  if (normalized === "active") {
    return SubscriptionStatus.ACTIVE;
  }

  if (normalized === "pending") {
    return SubscriptionStatus.PENDING;
  }

  if (normalized === "paused") {
    return SubscriptionStatus.PAUSED;
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return SubscriptionStatus.CANCELLED;
  }

  return SubscriptionStatus.SCHEDULED;
}

function getNextRestaurantStatus(
  preapprovalStatus?: string | null,
  trialEndsAt?: Date | null
) {
  const normalized = normalizeStatus(preapprovalStatus);

  if (normalized === "authorized" || normalized === "active") {
    return RestaurantStatus.ACTIVE;
  }

  if (normalized === "paused") {
    return RestaurantStatus.PAST_DUE;
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return RestaurantStatus.CANCELLED;
  }

  if (normalized === "pending") {
    if (trialEndsAt && trialEndsAt.getTime() > Date.now()) {
      return RestaurantStatus.TRIAL;
    }

    return RestaurantStatus.PAST_DUE;
  }

  return null;
}

async function syncRestaurantSubscription(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug,
    },
    include: {
      subscription: true,
    },
  });

  if (!restaurant) {
    throw new Error("Restaurante no encontrado.");
  }

  const preapprovalId = restaurant.subscription?.mercadopagoPreapprovalId;

  if (!preapprovalId || preapprovalId === "pendiente") {
    throw new Error("No hay una suscripción de Mercado Pago para verificar.");
  }

  const preapproval = await getMercadoPagoPreapproval(preapprovalId);

  const nextRestaurantStatus = getNextRestaurantStatus(
    preapproval.status,
    restaurant.trialEndsAt
  );

  if (!nextRestaurantStatus) {
    return {
      restaurant,
      activated: restaurant.status === RestaurantStatus.ACTIVE,
    };
  }

  const nextSubscriptionStatus = mapPreapprovalToSubscriptionStatus(
    preapproval.status
  );

  const renewsOn =
    typeof preapproval.next_payment_date === "string"
      ? new Date(preapproval.next_payment_date)
      : restaurant.subscription?.renewsOn ?? null;

  const updatedRestaurant = await prisma.restaurant.update({
    where: {
      id: restaurant.id,
    },
    data: {
      status: nextRestaurantStatus,
      graceUntil:
        nextRestaurantStatus === RestaurantStatus.PAST_DUE
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : null,
      trialEndsAt:
        nextRestaurantStatus === RestaurantStatus.ACTIVE
          ? null
          : restaurant.trialEndsAt,
      subscription: {
        update: {
          status: nextSubscriptionStatus,
          mercadopagoPayerEmail:
            typeof preapproval.payer_email === "string"
              ? preapproval.payer_email
              : restaurant.subscription?.mercadopagoPayerEmail ?? null,
          payerEmail:
            typeof preapproval.payer_email === "string"
              ? preapproval.payer_email
              : restaurant.subscription?.payerEmail ?? null,
          renewsOn:
            renewsOn && !Number.isNaN(renewsOn.getTime()) ? renewsOn : null,
        },
      },
    },
    include: {
      subscription: true,
    },
  });

  return {
    restaurant: updatedRestaurant,
    activated: nextRestaurantStatus === RestaurantStatus.ACTIVE,
  };
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { slug } = await params;

  try {
    const result = await syncRestaurantSubscription(slug);

    if (result.activated) {
      return NextResponse.redirect(`https://${result.restaurant.subdomain}/admin`);
    }

    return NextResponse.redirect(
      new URL(`/activar/${slug}?checked=1`, request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/activar/${slug}?sync_error=1`, request.url)
    );
  }
}
