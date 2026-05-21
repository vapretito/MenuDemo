type CreatePreapprovalInput = {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  planName: string;
  payerEmail: string;
  amountArs: number;
  trialEndsAt?: Date | string | null;
};

type MercadoPagoPreapprovalResponse = {
  id: string;
  status: string;
  init_point?: string;
  sandbox_init_point?: string;
  external_reference?: string;
  message?: string;
  error?: string;
  cause?: Array<{
    description?: string;
  }>;
};

const MERCADOPAGO_API_URL = "https://api.mercadopago.com";

function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en .env.local.");
  }

  return token;
}

function getBaseUrl() {
  const rawUrl =
    process.env.MENUI_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl.replace(/\/$/, "");
  }

  return `https://${rawUrl.replace(/\/$/, "")}`;
}
function normalizeDateToIso(value?: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}
export async function createMercadoPagoPreapproval(
  input: CreatePreapprovalInput
) {
  const accessToken = getMercadoPagoAccessToken();
  const baseUrl = getBaseUrl();

  const notificationUrl = `${baseUrl}/api/mercadopago/webhook`;
  const backUrl = `${baseUrl}/activar/${input.restaurantSlug}`;
  const startDate = normalizeDateToIso(input.trialEndsAt);

  const payload = {
    reason: `Menui - ${input.planName} - ${input.restaurantName}`,
    external_reference: input.restaurantId,
    payer_email: input.payerEmail,
    notification_url: notificationUrl,
    back_url: backUrl,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      ...(startDate
        ? {
            start_date: startDate,
          }
        : {}),
      transaction_amount: input.amountArs,
      currency_id: "ARS",
    },
    status: "pending",
  };

  console.log("[Mercado Pago Preapproval Request]", {
    tokenMode: accessToken.startsWith("TEST-") ? "test" : "production",
    restaurantId: input.restaurantId,
    restaurantSlug: input.restaurantSlug,
    planName: input.planName,
    amountArs: input.amountArs,
    payerEmail: input.payerEmail,
    startDate,
    notificationUrl,
    backUrl,
  });

  const response = await fetch(`${MERCADOPAGO_API_URL}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawResponse = await response.text();

  let data: MercadoPagoPreapprovalResponse = {} as MercadoPagoPreapprovalResponse;

  try {
    data = rawResponse ? JSON.parse(rawResponse) : {};
  } catch {
    data = {
      id: "",
      status: "",
      message: rawResponse,
    };
  }

  if (!response.ok) {
    console.error("[Mercado Pago Preapproval Error]", {
      status: response.status,
      data,
      payerEmail: input.payerEmail,
      restaurantSlug: input.restaurantSlug,
      backUrl,
      notificationUrl,
    });

    throw new Error(
      data.message ??
        data.error ??
        data.cause?.[0]?.description ??
        `Mercado Pago rechazó la suscripción. Status: ${response.status}`
    );
  }

  console.log("[Mercado Pago Preapproval Created]", {
    id: data.id,
    status: data.status,
    externalReference: data.external_reference,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  });

  return {
    id: data.id,
    status: data.status,
    initPoint: data.init_point ?? data.sandbox_init_point,
    externalReference: data.external_reference,
  };
}

export async function getMercadoPagoPreapproval(preapprovalId: string) {
  const accessToken = getMercadoPagoAccessToken();

  const response = await fetch(
    `${MERCADOPAGO_API_URL}/preapproval/${preapprovalId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("[Mercado Pago Get Preapproval Error]", {
      status: response.status,
      data,
    });

    throw new Error(
      data.message ??
        data.error ??
        `No se pudo consultar la suscripción. Status: ${response.status}`
    );
  }

  return data;
}