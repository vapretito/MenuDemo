import { NextResponse } from "next/server";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import { createMercadoPagoPreapproval } from "@/lib/mercadopago";

export async function POST(request: Request) {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json(
      { error: "No autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const restaurantId = String(body.restaurantId ?? "").trim();
    const restaurantName = String(body.restaurantName ?? "").trim();
    const planName = String(body.planName ?? "").trim();
    const payerEmail = String(body.payerEmail ?? "").trim();
    const amountArs = Number(body.amountArs ?? 0);
    const restaurantSlug = String(body.restaurantSlug ?? "").trim();

    if (!restaurantId || !restaurantSlug || !restaurantName || !planName || !payerEmail || amountArs <= 0) {
      return NextResponse.json(
        { error: "Faltan datos para crear la suscripción." },
        { status: 400 }
      );
    }

    const subscription = await createMercadoPagoPreapproval({
      restaurantId,
      restaurantSlug,
      restaurantName,
      planName,
      payerEmail,
      amountArs,
    });

    return NextResponse.json(subscription);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error creando suscripción de Mercado Pago.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}