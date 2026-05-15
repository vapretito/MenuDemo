type CreatePreapprovalInput = {
    restaurantId: string;
    restaurantName: string;
    planName: string;
    payerEmail: string;
    amountArs: number;
  };
  
  type MercadoPagoPreapprovalResponse = {
    id: string;
    status: string;
    init_point?: string;
    sandbox_init_point?: string;
    external_reference?: string;
    message?: string;
    error?: string;
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
    return process.env.MENUI_BASE_URL ?? "http://localhost:3000";
  }
  
  function getSubscriptionEndDate() {
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10);
  
    return endDate.toISOString();
  }
  
  export async function createMercadoPagoPreapproval(input: CreatePreapprovalInput) {
    const accessToken = getMercadoPagoAccessToken();
  
    const response = await fetch(`${MERCADOPAGO_API_URL}/preapproval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: `Menui - ${input.planName} - ${input.restaurantName}`,
        external_reference: input.restaurantId,
        payer_email: input.payerEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          end_date: getSubscriptionEndDate(),
          transaction_amount: input.amountArs,
          currency_id: "ARS",
        },
        back_url: `${getBaseUrl()}/backoffice`,
        status: "pending",
      }),
    });
  
    const data = (await response.json()) as MercadoPagoPreapprovalResponse;
  
    if (!response.ok) {
      throw new Error(
        data.message ??
          data.error ??
          "Mercado Pago rechazó la creación de la suscripción."
      );
    }
  
    return {
      id: data.id,
      status: data.status,
      initPoint: data.init_point ?? data.sandbox_init_point ?? null,
      externalReference: data.external_reference ?? input.restaurantId,
    };

    
  }
  export async function getMercadoPagoPreapproval(preapprovalId: string) {
    const accessToken = getMercadoPagoAccessToken();
  
    const response = await fetch(`${MERCADOPAGO_API_URL}/preapproval/${preapprovalId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
  
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