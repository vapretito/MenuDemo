"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./order-confirmation-view.module.css";
import {
  buildOrderConfirmationStorageKey,
  type ConfirmOrderPayload,
} from "@/lib/order-confirmation";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type OrderConfirmationViewProps = {
  restaurantName: string;
  slug: string;
};

export function OrderConfirmationView({
  restaurantName,
  slug,
}: OrderConfirmationViewProps) {
  const [payload, setPayload] = useState<ConfirmOrderPayload | null>(null);

  useEffect(() => {
    const storedValue = sessionStorage.getItem(
      buildOrderConfirmationStorageKey(slug)
    );

    if (!storedValue) return;

    try {
      const parsed = JSON.parse(storedValue) as ConfirmOrderPayload;
      setPayload(parsed);
    } catch (error) {
      console.error("[Order Confirmation Parse Error]", error);
    }
  }, [slug]);

  const openWhatsapp = () => {
    if (!payload) return;

    window.open(payload.whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const clearAndReturn = () => {
    sessionStorage.removeItem(buildOrderConfirmationStorageKey(slug));
  };

  if (!payload) {
    return (
      <main className={styles.shell}>
        <section className={styles.card}>
          <span className={styles.eyebrow}>Pedido no encontrado</span>
          <h1>No encontramos un pedido listo para confirmar.</h1>
          <p>
            Volve al menu de {restaurantName} y arma tu carrito otra vez para
            continuar con el pedido.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href={`/menu/${slug}`}>
              Volver al menu
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <span className={styles.eyebrow}>Pedido listo</span>
        <h1>Revisa tu pedido antes de abrir WhatsApp</h1>
        <p>
          Ya preparamos el resumen para {payload.restaurantName}. El siguiente
          paso es abrir WhatsApp y enviar el mensaje al local.
        </p>

        <div className={styles.summaryGrid}>
          <article className={styles.summaryBox}>
            <span>Cliente</span>
            <strong>{payload.customerName}</strong>
            <small>{payload.customerWhatsapp}</small>
          </article>
          <article className={styles.summaryBox}>
            <span>Entrega</span>
            <strong>
              {payload.deliveryAddress || "Direccion a confirmar por WhatsApp"}
            </strong>
            <small>{payload.paymentMethodLabel}</small>
          </article>
        </div>

        <div className={styles.orderBox}>
          <div className={styles.orderHeader}>
            <span>Resumen del pedido</span>
            <strong>{money.format(payload.totalArs)}</strong>
          </div>

          <div className={styles.orderList}>
            {payload.items.map((item) => (
              <div className={styles.orderRow} key={item.id}>
                <div>
                  <strong>
                    {item.quantity}x {item.name}
                  </strong>
                  <small>{money.format(item.price)} por unidad</small>
                </div>
                <span>{money.format(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {payload.customerNote ? (
            <div className={styles.noteBox}>
              <span>Notas para el local</span>
              <p>{payload.customerNote}</p>
            </div>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={openWhatsapp}
            type="button"
          >
            Abrir WhatsApp y enviar
          </button>
          <Link
            className={styles.secondaryButton}
            href={`/menu/${slug}`}
            onClick={clearAndReturn}
          >
            Volver al menu
          </Link>
        </div>

        <p className={styles.footnote}>
          El pedido queda sujeto a confirmacion final del restaurante en
          WhatsApp.
        </p>
      </section>
    </main>
  );
}
