import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { prisma } from "@/lib/prisma";
import {
  formatLocalOrderReference,
  getLocalOrderStatusLabel,
  getLocalOrderStatusMessage,
} from "@/lib/local-ordering";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type LocalOrderStatusPageProps = {
  params: Promise<{
    slug: string;
    orderId: string;
  }>;
};

export default async function LocalOrderStatusPage({
  params,
}: LocalOrderStatusPageProps) {
  const { slug, orderId } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurant: {
        slug,
      },
    },
    include: {
      restaurant: {
        select: {
          name: true,
          slug: true,
        },
      },
      serviceLocation: {
        select: {
          name: true,
        },
      },
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const reference = formatLocalOrderReference(
    order.customerName,
    order.pickupCode
  );
  const statusLabel = getLocalOrderStatusLabel(order.status);
  const statusMessage = getLocalOrderStatusMessage(order.status);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.eyebrow}>Pedido en local</span>
        <h1>{order.restaurant.name}</h1>
        <p className={styles.reference}>{reference}</p>

        <div className={styles.statusBox}>
          <strong>{statusLabel}</strong>
          <p>{statusMessage}</p>
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
            <strong>{order.serviceLocation?.name ?? "Retiro en caja"}</strong>
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
          <a className={styles.primary} href={`/ordenar/${order.restaurant.slug}`}>
            Hacer otro pedido
          </a>
          <a className={styles.secondary} href={`/menu/${order.restaurant.slug}`}>
            Ver menu delivery
          </a>
        </div>
      </section>
    </main>
  );
}
