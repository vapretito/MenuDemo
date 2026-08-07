"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import {
  formatLocalOrderReference,
  getLocalOrderStatusLabel,
  getLocalOrderStatusMessage,
} from "@/lib/local-ordering";
import {
  getBrowserNotificationPermission,
  playNotificationTone,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from "@/lib/browser-notifications";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type LocalOrderStatusValue =
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "EXPIRED"
  | "CANCELLED";

type LocalPaymentStatusValue = "PENDING" | "PAID" | "CANCELLED";

type LocalOrderStatusSnapshot = {
  id: string;
  customerName: string | null;
  pickupCode: string | null;
  status: LocalOrderStatusValue;
  paymentStatus: LocalPaymentStatusValue;
  totalArs: number;
  createdAt: string;
  confirmedAt: string | null;
  paidAt: string | null;
  updatedAt: string;
  restaurant: {
    name: string;
    slug: string;
  };
  serviceLocationName: string | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    subtotalArs: number;
    notes: string | null;
  }>;
};

type LocalOrderStatusClientProps = {
  initialOrder: LocalOrderStatusSnapshot;
  repeatOrderHref?: string;
  menuHref?: string;
  eyebrowLabel?: string;
  statusPageHref?: string;
};

const canUsePushNotifications = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

const buildClientNotificationMessage = (order: LocalOrderStatusSnapshot) => {
  const statusLabel = getLocalOrderStatusLabel(order.status);

  if (order.status === "READY") {
    return `${statusLabel}. Ya podes retirarlo en el local.`;
  }

  if (order.status === "DELIVERED") {
    return "Tu pedido fue entregado.";
  }

  return `Estado actualizado: ${statusLabel}.`;
};

export function LocalOrderStatusClient({
  initialOrder,
  repeatOrderHref,
  menuHref,
  eyebrowLabel = "Pedido en local",
  statusPageHref,
}: LocalOrderStatusClientProps) {
  const [order, setOrder] = useState(initialOrder);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    getBrowserNotificationPermission() === "granted"
  );
  const [pushSupported, setPushSupported] = useState(false);
  const previousStatusRef = useRef(initialOrder.status);
  const previousPaymentStatusRef = useRef(initialOrder.paymentStatus);

  const reference = useMemo(
    () => formatLocalOrderReference(order.customerName, order.pickupCode),
    [order.customerName, order.pickupCode]
  );
  const statusLabel = useMemo(
    () => getLocalOrderStatusLabel(order.status),
    [order.status]
  );
  const statusMessage = useMemo(
    () => getLocalOrderStatusMessage(order.status),
    [order.status]
  );

  const subscribeToPushNotifications = useEffectEvent(async () => {
    if (!pushSupported || getBrowserNotificationPermission() !== "granted") {
      return {
        ok: false,
        reason: "unsupported",
      } as const;
    }

    const keyResponse = await fetch("/api/push/public-key", {
      cache: "no-store",
    });
    const keyData = (await keyResponse.json().catch(() => ({}))) as {
      configured?: boolean;
      publicKey?: string | null;
    };

    if (!keyResponse.ok || !keyData.configured || !keyData.publicKey) {
      return {
        ok: false,
        reason: "not_configured",
      } as const;
    }

    const registration = await navigator.serviceWorker.register("/menui-push-sw.js");
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });
    }

    const targetUrl =
      statusPageHref ??
      `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const response = await fetch(
      `/api/local-orders/${order.id}/push-subscription?slug=${encodeURIComponent(order.restaurant.slug)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          targetUrl,
        }),
      }
    );

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(data.error ?? "No se pudo registrar la suscripcion push.");
    }

    return {
      ok: true,
    } as const;
  });

  const loadLatestOrder = useEffectEvent(async () => {
    try {
      const response = await fetch(
        `/api/local-orders/${order.id}?slug=${encodeURIComponent(order.restaurant.slug)}`,
        {
          cache: "no-store",
        }
      );

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        order?: Omit<LocalOrderStatusSnapshot, "serviceLocationName" | "items">;
      };

      if (!response.ok || !data.ok || !data.order) {
        return;
      }

      const nextOrder = {
        ...order,
        ...data.order,
      };
      const statusChanged = nextOrder.status !== previousStatusRef.current;
      const paymentChanged =
        nextOrder.paymentStatus !== previousPaymentStatusRef.current;

      setOrder(nextOrder);

      if (statusChanged || paymentChanged) {
        previousStatusRef.current = nextOrder.status;
        previousPaymentStatusRef.current = nextOrder.paymentStatus;

        void playNotificationTone();

        if (notificationsEnabled) {
          showBrowserNotification(
            nextOrder.restaurant.name,
            buildClientNotificationMessage(nextOrder),
            {
              tag: `local-order-${nextOrder.id}`,
            }
          );
        }
      }
    } catch (error) {
      console.error("[Load Local Order Status Error]", error);
    }
  });

  useEffect(() => {
    previousStatusRef.current = order.status;
    previousPaymentStatusRef.current = order.paymentStatus;
  }, [order.paymentStatus, order.status]);

  useEffect(() => {
    document.title = `${statusLabel} | ${order.restaurant.name}`;
  }, [order.restaurant.name, statusLabel]);

  useEffect(() => {
    setPushSupported(canUsePushNotifications());
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadLatestOrder();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!notificationsEnabled || !pushSupported) {
      return;
    }

    void subscribeToPushNotifications().catch((error) => {
      console.error("[Push Subscription Sync Error]", error);
    });
  }, [notificationsEnabled, pushSupported]);

  const enableNotifications = async () => {
    const permission = await requestBrowserNotificationPermission();
    const granted = permission === "granted";
    setNotificationsEnabled(granted);

    if (granted) {
      try {
        const result = await subscribeToPushNotifications();

        if (!result.ok && result.reason === "not_configured") {
          window.alert(
            "Las notificaciones push todavia no estan configuradas en Menui. Cuando carguemos las claves del proyecto, este boton ya va a avisarte aun con la app cerrada."
          );
          return;
        }

        void playNotificationTone();
        showBrowserNotification(
          order.restaurant.name,
          "Te vamos a avisar aunque salgas de la PWA cuando tu pedido cambie de estado.",
          {
            tag: `local-order-subscription-${order.id}`,
          }
        );
      } catch (error) {
        console.error("[Push Subscription Enable Error]", error);
        window.alert(
          error instanceof Error
            ? error.message
            : "No se pudo activar la suscripcion push en este dispositivo."
        );
      }
      return;
    }

    if (permission !== "denied") {
      window.alert(
        "Tu navegador no soporta notificaciones o no pudo activarlas."
      );
      return;
    }

    window.alert(
      "Las notificaciones quedaron bloqueadas en este navegador. Podes habilitarlas manualmente desde la configuracion del sitio."
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.eyebrow}>{eyebrowLabel}</span>
        <h1>{order.restaurant.name}</h1>
        <p className={styles.reference}>{reference}</p>

        <div className={styles.statusBox}>
          <strong>{statusLabel}</strong>
          <p>{statusMessage}</p>
        </div>

        <div className={styles.noticeRow}>
          <p className={styles.noticeText}>
            Esta pantalla se actualiza sola. Si activas las notificaciones, te
            podemos avisar tambien fuera de la PWA cuando cambie el estado del pedido.
          </p>
          <button
            className={notificationsEnabled ? styles.secondary : styles.primary}
            onClick={() => void enableNotifications()}
            type="button"
            disabled={!pushSupported}
          >
            {!pushSupported
              ? "Push no disponible"
              : notificationsEnabled
                ? "Notificaciones activas"
                : "Activar notificaciones"}
          </button>
        </div>

        <div className={styles.metaGrid}>
          <article>
            <span>Codigo</span>
            <strong>{order.pickupCode ?? "Sin codigo"}</strong>
          </article>
          <article>
            <span>Cliente</span>
            <strong>{order.customerName ?? "Pedido en local"}</strong>
          </article>
          <article>
            <span>Ubicacion</span>
            <strong>{order.serviceLocationName ?? "Retiro en caja"}</strong>
          </article>
          <article>
            <span>Total</span>
            <strong>{money.format(order.totalArs)}</strong>
          </article>
        </div>

        <section className={styles.itemsBox}>
          <div className={styles.itemsHeader}>
            <strong>Resumen del pedido</strong>
            <span>{order.items.length} productos</span>
          </div>

          <div className={styles.itemsList}>
            {order.items.map((item) => (
              <article className={styles.itemRow} key={item.id}>
                <div>
                  <strong>
                    {item.quantity} x {item.productName}
                  </strong>
                  {item.notes ? <p>{item.notes}</p> : null}
                </div>
                <span>{money.format(item.subtotalArs)}</span>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.actions}>
          <a
            className={styles.primary}
            href={repeatOrderHref ?? `/ordenar/${order.restaurant.slug}`}
          >
            Hacer otro pedido
          </a>
          <a
            className={styles.secondary}
            href={menuHref ?? `/menu/${order.restaurant.slug}`}
          >
            Ver menu delivery
          </a>
        </div>
      </section>
    </main>
  );
}
