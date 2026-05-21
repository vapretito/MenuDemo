import { NextRequest, NextResponse } from "next/server";
import {
  RestaurantStatus,
  SubscriptionStatus,
} from "@/generated/prisma/client";import { prisma } from "@/lib/prisma";
import {
  extractRestaurantReference,
  getMercadoPagoAuthorizedPayment,
  getMercadoPagoPayment,
  getMercadoPagoPreapproval,
  mapPaymentStatusToRestaurantStatus,
  mapPreapprovalStatusToRestaurantStatus,
  verifyMercadoPagoSignature,
} from "@/lib/mercadopago-webhook";

export const runtime = "nodejs";

type MercadoPagoWebhookBody = {
  action?: string;
  type?: string;
  data?: {
    id?: string | number;
  };
};

function mapMercadoPagoStatusToSubscriptionStatus(
  status?: string | null
): SubscriptionStatus {
  const normalized = status?.toLowerCase();

  if (
    normalized === "authorized" ||
    normalized === "active" ||
    normalized === "approved" ||
    normalized === "accredited"
  ) {
    return SubscriptionStatus.ACTIVE;
  }

  if (normalized === "pending") {
    return SubscriptionStatus.PENDING;
  }

  if (normalized === "in_process") {
    return SubscriptionStatus.SCHEDULED;
  }

  if (
    normalized === "paused" ||
    normalized === "rejected" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return SubscriptionStatus.PAUSED;
  }

  return SubscriptionStatus.PAUSED;
}

async function activateRestaurantByReference(input: {
  reference: string;
  nextStatus: RestaurantStatus;
  mercadopagoStatus?: string | null;
  payerEmail?: string | null;
  preapprovalId?: string | null;
}) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        {
          id: input.reference,
        },
        {
          slug: input.reference,
        },
        {
          subscription: {
            mercadopagoPreapprovalId: input.reference,
          },
        },
      ],
    },
    include: {
      subscription: true,
    },
  });

  if (!restaurant) {
    console.warn("[MP Webhook] Restaurante no encontrado", input);
    return null;
  }

  const graceUntil =
    input.nextStatus === RestaurantStatus.PAST_DUE
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : null;

  const updatedRestaurant = await prisma.restaurant.update({
    where: {
      id: restaurant.id,
    },
    data: {
      status: input.nextStatus,
      graceUntil,
      trialEndsAt:
        input.nextStatus === RestaurantStatus.ACTIVE ||
        input.nextStatus === RestaurantStatus.MANUAL
          ? null
          : restaurant.trialEndsAt,
          subscription: {
            update: {
              status: mapMercadoPagoStatusToSubscriptionStatus(
                input.mercadopagoStatus
              ),
              ...(input.preapprovalId
                ? {
                    mercadopagoPreapprovalId: input.preapprovalId,
                  }
                : {}),
              ...(input.payerEmail
                ? {
                    payerEmail: input.payerEmail,
                  }
                : {}),
            },
          },
    },
    include: {
      subscription: true,
    },
  });

  console.log("[MP Webhook] Restaurante actualizado", {
    restaurantId: updatedRestaurant.id,
    slug: updatedRestaurant.slug,
    status: updatedRestaurant.status,
  });

  return updatedRestaurant;
}

async function handlePaymentNotification(resourceId: string) {
  const payment = await getMercadoPagoPayment(resourceId);

  const nextStatus = mapPaymentStatusToRestaurantStatus(payment.status);

  if (!nextStatus) {
    console.log("[MP Webhook] Payment status ignorado", {
      id: payment.id,
      status: payment.status,
    });

    return;
  }

  const reference = extractRestaurantReference({
    externalReference: payment.external_reference,
    metadata: payment.metadata,
  });

  if (!reference) {
    console.warn("[MP Webhook] Payment sin external_reference", {
      paymentId: payment.id,
      status: payment.status,
    });

    return;
  }

  await activateRestaurantByReference({
    reference,
    nextStatus,
    mercadopagoStatus: payment.status,
    payerEmail: payment.payer?.email ?? null,
  });
}

async function handlePreapprovalNotification(resourceId: string) {
  const preapproval = await getMercadoPagoPreapproval(resourceId);

  const nextStatus = mapPreapprovalStatusToRestaurantStatus(preapproval.status);

  if (!nextStatus) {
    console.log("[MP Webhook] Preapproval status ignorado", {
      id: preapproval.id,
      status: preapproval.status,
    });

    return;
  }

  const reference = preapproval.external_reference || preapproval.id;

  await activateRestaurantByReference({
    reference,
    nextStatus,
    mercadopagoStatus: preapproval.status,
    payerEmail: preapproval.payer_email ?? null,
    preapprovalId: preapproval.id,
  });
}

async function handleAuthorizedPaymentNotification(resourceId: string) {
  const authorizedPayment = await getMercadoPagoAuthorizedPayment(resourceId);

  const paymentStatus =
    authorizedPayment.payment?.status ?? authorizedPayment.status;

  const nextStatus = mapPaymentStatusToRestaurantStatus(paymentStatus);

  if (!nextStatus) {
    console.log("[MP Webhook] Authorized payment status ignorado", {
      id: authorizedPayment.id,
      status: paymentStatus,
    });

    return;
  }

  const reference =
    authorizedPayment.external_reference ||
    authorizedPayment.preapproval_id;

  if (!reference) {
    console.warn("[MP Webhook] Authorized payment sin referencia", {
      id: authorizedPayment.id,
    });

    return;
  }

  await activateRestaurantByReference({
    reference,
    nextStatus,
    mercadopagoStatus: paymentStatus,
    preapprovalId: authorizedPayment.preapproval_id ?? null,
  });
}

export async function POST(request: NextRequest) {
  let body: MercadoPagoWebhookBody = {};

  try {
    body = (await request.json()) as MercadoPagoWebhookBody;
  } catch {
    body = {};
  }

  const searchParams = request.nextUrl.searchParams;

  const resourceId = String(
    searchParams.get("data.id") ??
      searchParams.get("id") ??
      body.data?.id ??
      ""
  ).trim();

  const notificationType = String(
    searchParams.get("type") ??
      body.type ??
      ""
  ).trim();

  const isValidSignature = verifyMercadoPagoSignature({
    dataId: resourceId,
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
  });

  if (!isValidSignature) {
    console.warn("[MP Webhook] Firma inválida", {
      resourceId,
      notificationType,
    });

    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!resourceId) {
    console.warn("[MP Webhook] Sin resourceId", {
      body,
      url: request.url,
    });

    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    if (notificationType === "payment") {
      await handlePaymentNotification(resourceId);
    } else if (notificationType === "subscription_preapproval") {
      await handlePreapprovalNotification(resourceId);
    } else if (notificationType === "subscription_authorized_payment") {
      await handleAuthorizedPaymentNotification(resourceId);
    } else {
      console.log("[MP Webhook] Tipo ignorado", {
        notificationType,
        resourceId,
        action: body.action,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[MP Webhook Error]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo procesar webhook.",
      },
      { status: 500 }
    );
  }
}