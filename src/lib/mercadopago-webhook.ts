import crypto from "crypto";
import { RestaurantStatus } from "@/generated/prisma/client";

const MERCADOPAGO_API_BASE = "https://api.mercadopago.com";

type MercadoPagoPayment = {
  id: number;
  status?: string;
  status_detail?: string;
  external_reference?: string | null;
  payer?: {
    email?: string | null;
  };
  metadata?: Record<string, unknown>;
};

type MercadoPagoPreapproval = {
  id: string;
  status?: string;
  external_reference?: string | null;
  payer_email?: string | null;
};

type MercadoPagoAuthorizedPayment = {
  id: number;
  status?: string;
  preapproval_id?: string | null;
  external_reference?: string | null;
  payment?: {
    id?: number;
    status?: string;
  };
};

export function verifyMercadoPagoSignature(input: {
  dataId: string;
  xSignature: string | null;
  xRequestId: string | null;
}) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  if (!input.xSignature || !input.xRequestId || !input.dataId) {
    return false;
  }

  const signatureParts = input.xSignature.split(",");

  let ts = "";
  let hash = "";

  for (const part of signatureParts) {
    const [key, value] = part.split("=");

    if (key?.trim() === "ts") {
      ts = value?.trim() ?? "";
    }

    if (key?.trim() === "v1") {
      hash = value?.trim() ?? "";
    }
  }

  if (!ts || !hash) {
    return false;
  }

  const manifest = `id:${input.dataId};request-id:${input.xRequestId};ts:${ts};`;

  const generatedHash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hash)
  );
}

async function mercadoPagoGet<T>(path: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN.");
  }

  const response = await fetch(`${MERCADOPAGO_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as T & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message ?? data.error ?? `Mercado Pago error ${response.status}`
    );
  }

  return data;
}

export async function getMercadoPagoPayment(paymentId: string) {
  return mercadoPagoGet<MercadoPagoPayment>(`/v1/payments/${paymentId}`);
}

export async function getMercadoPagoPreapproval(preapprovalId: string) {
  return mercadoPagoGet<MercadoPagoPreapproval>(
    `/preapproval/${preapprovalId}`
  );
}

export async function getMercadoPagoAuthorizedPayment(authorizedPaymentId: string) {
  return mercadoPagoGet<MercadoPagoAuthorizedPayment>(
    `/authorized_payments/${authorizedPaymentId}`
  );
}

export function mapPaymentStatusToRestaurantStatus(status?: string | null) {
  const normalized = status?.toLowerCase();

  if (normalized === "approved" || normalized === "accredited") {
    return RestaurantStatus.ACTIVE;
  }

  if (normalized === "pending" || normalized === "in_process") {
    return RestaurantStatus.TRIAL;
  }

  if (normalized === "rejected" || normalized === "cancelled" || normalized === "canceled") {
    return RestaurantStatus.PAST_DUE;
  }

  return null;
}

export function mapPreapprovalStatusToRestaurantStatus(status?: string | null) {
  const normalized = status?.toLowerCase();

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
    return RestaurantStatus.TRIAL;
  }

  return null;
}

export function extractRestaurantReference(input: {
  externalReference?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const externalReference = input.externalReference?.trim();

  if (externalReference) {
    return externalReference;
  }

  const restaurantId = input.metadata?.restaurantId;
  const restaurantSlug = input.metadata?.restaurantSlug;

  if (typeof restaurantId === "string" && restaurantId.trim()) {
    return restaurantId.trim();
  }

  if (typeof restaurantSlug === "string" && restaurantSlug.trim()) {
    return restaurantSlug.trim();
  }

  return null;
}