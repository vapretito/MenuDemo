import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isWebPushConfigured } from "@/lib/web-push";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type PushSubscriptionPayload = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

const isValidTargetUrl = (value: string) =>
  value.startsWith("/") && !value.startsWith("//");

export async function POST(request: Request, context: RouteContext) {
  try {
    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: "Las push notifications todavia no estan configuradas." },
        { status: 503 }
      );
    }

    const { orderId } = await context.params;
    const { searchParams } = new URL(request.url);
    const slug = String(searchParams.get("slug") ?? "").trim();

    if (!slug) {
      return NextResponse.json(
        { error: "Falta el restaurante del pedido." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      subscription?: PushSubscriptionPayload;
      targetUrl?: string;
    };

    const subscription = body.subscription;
    const endpoint = String(subscription?.endpoint ?? "").trim();
    const p256dh = String(subscription?.keys?.p256dh ?? "").trim();
    const auth = String(subscription?.keys?.auth ?? "").trim();
    const targetUrl = String(body.targetUrl ?? "").trim();

    if (!endpoint || !p256dh || !auth || !isValidTargetUrl(targetUrl)) {
      return NextResponse.json(
        { error: "La suscripcion push no es valida." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurant: {
          slug,
        },
      },
      select: {
        id: true,
        restaurantId: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No encontramos ese pedido." },
        { status: 404 }
      );
    }

    const expirationTime =
      typeof subscription?.expirationTime === "number"
        ? new Date(subscription.expirationTime)
        : null;

    await prisma.localOrderPushSubscription.upsert({
      where: {
        orderId_endpoint: {
          orderId: order.id,
          endpoint,
        },
      },
      create: {
        orderId: order.id,
        restaurantId: order.restaurantId,
        endpoint,
        p256dh,
        auth,
        targetUrl,
        expirationTime,
      },
      update: {
        p256dh,
        auth,
        targetUrl,
        expirationTime,
      },
    });

    return NextResponse.json({
      ok: true,
      subscribed: true,
    });
  } catch (error) {
    console.error("[Local Order Push Subscription Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo activar la suscripcion push.",
      },
      { status: 500 }
    );
  }
}
