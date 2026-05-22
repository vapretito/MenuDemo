import { NextRequest, NextResponse } from "next/server";
import {
  RestaurantStatus,
  SubscriptionStatus,
} from "@/generated/prisma/client";
import { createMercadoPagoPreapproval } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

const fallbackPlans: Record<
  string,
  {
    name: string;
    amountArs: number;
  }
> = {
  basic: {
    name: "Menui Basic",
    amountArs: 20000,
  },
  test_real: {
    name: "Menui Test Real",
    amountArs: 500,
  },
};

async function createReactivationCheckout(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug,
    },
    include: {
      subscription: true,
      users: {
        where: {
          role: "RESTAURANT_ADMIN",
        },
        select: {
          email: true,
        },
        take: 1,
      },
    },
  });

  if (!restaurant) {
    throw new Error("Restaurante no encontrado.");
  }

  if (restaurant.status === RestaurantStatus.ACTIVE) {
    return {
      restaurant,
      alreadyActive: true,
      checkoutUrl: null,
    };
  }

  const currentSubscription = restaurant.subscription;

  if (!currentSubscription) {
    throw new Error("Este restaurante no tiene una suscripción configurada.");
  }

  if (currentSubscription.mercadopagoInitPoint) {
    return {
      restaurant,
      alreadyActive: false,
      checkoutUrl: currentSubscription.mercadopagoInitPoint,
    };
  }

  const fallbackPlan =
    fallbackPlans[currentSubscription.planId] ?? fallbackPlans.basic;

  const planName = currentSubscription.planName || fallbackPlan.name;
  const amountArs = currentSubscription.amountArs || fallbackPlan.amountArs;

  const payerEmail =
    currentSubscription.mercadopagoPayerEmail ||
    currentSubscription.payerEmail ||
    restaurant.users[0]?.email ||
    "";

  if (!payerEmail) {
    throw new Error("No se encontró email para generar la activación.");
  }

  const mercadoPagoSubscription = await createMercadoPagoPreapproval({
    restaurantId: restaurant.id,
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    planName,
    amountArs,
    payerEmail,
    trialEndsAt: null,
  });

  const checkoutUrl = mercadoPagoSubscription.initPoint;

  if (!checkoutUrl) {
    throw new Error("Mercado Pago no devolvió el link de pago.");
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: {
      id: restaurant.id,
    },
    data: {
      graceUntil: null,
      subscription: {
        update: {
          status: SubscriptionStatus.SCHEDULED,
          mercadopagoPreapprovalId: mercadoPagoSubscription.id,
          mercadopagoInitPoint: checkoutUrl,
          mercadopagoPayerEmail: payerEmail,
          payerEmail,
          renewsOn: null,
        },
      },
    },
    include: {
      subscription: true,
    },
  });

  return {
    restaurant: updatedRestaurant,
    alreadyActive: false,
    checkoutUrl,
  };
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { slug } = await params;

  try {
    const result = await createReactivationCheckout(slug);

    if (result.alreadyActive) {
      return NextResponse.redirect(
        `https://${result.restaurant.subdomain}/admin`
      );
    }

    if (!result.checkoutUrl) {
      throw new Error("No se pudo generar el link de activación.");
    }

    return NextResponse.redirect(result.checkoutUrl);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo generar la activación.";

    const url = new URL(`/activar/${slug}`, request.url);
    url.searchParams.set("reactivate_error", message);

    return NextResponse.redirect(url);
  }
}
