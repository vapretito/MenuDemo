import "server-only";

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type OrderPushNotificationInput = {
  orderId: string;
  title: string;
  body: string;
  tag?: string;
};

const publicKey =
  process.env.WEB_PUSH_PUBLIC_KEY?.trim() ||
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim() ||
  "";
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY?.trim() || "";
const subject =
  process.env.WEB_PUSH_SUBJECT?.trim() || "mailto:hola@menui.online";

let vapidConfigured = false;

const ensureWebPushConfigured = () => {
  if (!publicKey || !privateKey) {
    return false;
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }

  return true;
};

export const isWebPushConfigured = () =>
  Boolean(publicKey) && Boolean(privateKey);

export const getWebPushPublicKey = () => (publicKey ? publicKey : null);

export const buildLocalOrderStatusPushBody = (input: {
  status: string;
  pickupCode?: string | null;
  restaurantName: string;
}) => {
  const reference = input.pickupCode ? ` ${input.pickupCode}` : "";

  switch (input.status) {
    case "CONFIRMED":
      return `Tu pedido${reference} fue confirmado en ${input.restaurantName}.`;
    case "PREPARING":
      return `Tu pedido${reference} ya esta en preparacion.`;
    case "READY":
      return `Tu pedido${reference} ya esta listo para retirar.`;
    case "DELIVERED":
      return `Tu pedido${reference} fue entregado.`;
    case "CANCELLED":
      return `Tu pedido${reference} fue cancelado.`;
    case "EXPIRED":
      return `Tu pedido${reference} vencio antes de confirmarse.`;
    default:
      return `El estado de tu pedido${reference} cambio en ${input.restaurantName}.`;
  }
};

export async function sendLocalOrderPushNotifications(
  input: OrderPushNotificationInput
) {
  if (!ensureWebPushConfigured()) {
    return { configured: false, sent: 0, removed: 0 };
  }

  const subscriptions = await prisma.localOrderPushSubscription.findMany({
    where: {
      orderId: input.orderId,
    },
  });

  if (!subscriptions.length) {
    return { configured: true, sent: 0, removed: 0 };
  }

  let sent = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime?.getTime() ?? null,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: input.title,
            body: input.body,
            tag: input.tag ?? `local-order-${input.orderId}`,
            url: subscription.targetUrl,
            icon: "/logos/menui-logo.svg",
            badge: "/logos/menui-logo.svg",
          })
        );

        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof error.statusCode === "number"
            ? error.statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.localOrderPushSubscription.delete({
            where: {
              orderId_endpoint: {
                orderId: subscription.orderId,
                endpoint: subscription.endpoint,
              },
            },
          });
          removed += 1;
          return;
        }

        console.error("[Web Push Send Error]", error);
      }
    })
  );

  return {
    configured: true,
    sent,
    removed,
  };
}
