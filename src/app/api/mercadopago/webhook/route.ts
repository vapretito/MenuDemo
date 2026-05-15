import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getMercadoPagoPreapproval } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MercadoPagoWebhookBody = {
  action?: string;
  api_version?: string;
  data?: {
    id?: string | number;
  };
  date_created?: string;
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  user_id?: string | number;
};

type ParsedSignature = {
  ts: string | null;
  v1: string | null;
};

function parseMercadoPagoSignature(signatureHeader: string | null): ParsedSignature {
  if (!signatureHeader) {
    return {
      ts: null,
      v1: null,
    };
  }

  return signatureHeader.split(",").reduce<ParsedSignature>(
    (acc, part) => {
      const [rawKey, ...rawValueParts] = part.split("=");
      const key = rawKey?.trim();
      const value = rawValueParts.join("=").trim();

      if (key === "ts") {
        acc.ts = value;
      }

      if (key === "v1") {
        acc.v1 = value;
      }

      return acc;
    },
    {
      ts: null,
      v1: null,
    }
  );
}

function safeCompareHex(a: string, b: string) {
  const isHex = /^[a-f0-9]+$/i;

  if (!isHex.test(a) || !isHex.test(b)) {
    return false;
  }

  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function getSignatureDataId(url: URL) {
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (!dataId) {
    return null;
  }

  return dataId.toLowerCase();
}

function buildSignatureManifest(params: {
  dataId: string | null;
  requestId: string | null;
  ts: string | null;
}) {
  let manifest = "";

  if (params.dataId) {
    manifest += `id:${params.dataId};`;
  }

  if (params.requestId) {
    manifest += `request-id:${params.requestId};`;
  }

  if (params.ts) {
    manifest += `ts:${params.ts};`;
  }

  return manifest;
}

function validateMercadoPagoSignature(request: Request, url: URL) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return {
      valid: true,
      skipped: true,
      reason: "MERCADOPAGO_WEBHOOK_SECRET no configurado. Validación omitida en desarrollo.",
    };
  }

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  const { ts, v1 } = parseMercadoPagoSignature(signatureHeader);

  if (!signatureHeader || !ts || !v1) {
    return {
      valid: false,
      skipped: false,
      reason: "Faltan headers de firma: x-signature, ts o v1.",
    };
  }

  const dataId = getSignatureDataId(url);

  const manifest = buildSignatureManifest({
    dataId,
    requestId,
    ts,
  });

  const expectedSignature = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const valid = safeCompareHex(expectedSignature, v1);

  return {
    valid,
    skipped: false,
    reason: valid ? "Firma válida." : "Firma inválida.",
    meta: {
      dataId,
      requestId,
      ts,
      manifest,
    },
  };
}

function extractEventType(body: MercadoPagoWebhookBody, url: URL) {
  return url.searchParams.get("type") ?? body.type ?? "unknown";
}

function extractResourceId(body: MercadoPagoWebhookBody, url: URL) {
  return (
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    body.data?.id ??
    body.id ??
    null
  );
}

function isMercadoPagoSimulationId(resourceId: unknown) {
  return String(resourceId) === "123456";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Menui Mercado Pago webhook activo.",
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as MercadoPagoWebhookBody;

  const signatureValidation = validateMercadoPagoSignature(request, url);

  if (!signatureValidation.valid) {
    console.warn("[Mercado Pago Webhook] firma rechazada", {
      reason: signatureValidation.reason,
    });

    return NextResponse.json(
      {
        received: false,
        error: "Firma inválida.",
      },
      { status: 401 }
    );
  }

  if (signatureValidation.skipped) {
    console.warn("[Mercado Pago Webhook] validación omitida", {
      reason: signatureValidation.reason,
    });
  } else {
    console.log("[Mercado Pago Webhook] firma validada", signatureValidation.meta);
  }

  const eventType = extractEventType(body, url);
  const resourceId = extractResourceId(body, url);

  console.log("[Mercado Pago Webhook] recibido", {
    type: eventType,
    bodyType: body.type,
    action: body.action,
    resourceId,
    liveMode: body.live_mode,
    userId: body.user_id,
  });

  try {
    if (isMercadoPagoSimulationId(resourceId)) {
      console.log("[Mercado Pago Webhook] simulación detectada", {
        resourceId,
        note: "Mercado Pago envió un ID fake. No se consulta la API.",
      });

      return NextResponse.json({
        received: true,
        simulated: true,
      });
    }

    if (eventType === "subscription_preapproval" && resourceId) {
      const subscription = await getMercadoPagoPreapproval(String(resourceId));

      console.log("[Mercado Pago Webhook] suscripción consultada", {
        id: subscription.id,
        status: subscription.status,
        externalReference: subscription.external_reference,
        payerEmail: subscription.payer_email,
        nextPaymentDate: subscription.next_payment_date,
        reason: subscription.reason,
      });

      return NextResponse.json({
        received: true,
        type: eventType,
        subscriptionStatus: subscription.status,
      });
    }

    if (eventType === "subscription_authorized_payment") {
      console.log("[Mercado Pago Webhook] pago autorizado de suscripción", {
        resourceId,
        note: "Después lo vamos a persistir como Payment cuando conectemos base real.",
      });

      return NextResponse.json({
        received: true,
        type: eventType,
      });
    }

    if (eventType === "payment") {
      console.log("[Mercado Pago Webhook] pago recibido", {
        paymentId: resourceId,
        note: "Después consultamos el payment y lo asociamos al restaurante.",
      });

      return NextResponse.json({
        received: true,
        type: eventType,
      });
    }

    console.log("[Mercado Pago Webhook] evento no manejado específicamente", {
      eventType,
      resourceId,
    });

    return NextResponse.json({
      received: true,
      type: eventType,
    });
  } catch (error) {
    console.error("[Mercado Pago Webhook Error no bloqueante]", {
      eventType,
      resourceId,
      error: error instanceof Error ? error.message : error,
    });

    return NextResponse.json({
      received: true,
      warning: "Webhook recibido, pero no se pudo procesar completamente.",
    });
  }
}