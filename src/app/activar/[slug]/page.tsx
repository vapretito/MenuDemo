import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

type ActivationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    TRIAL: "Prueba gratuita",
    ACTIVE: "Activo",
    PAST_DUE: "Pago pendiente",
    SUSPENDED: "Suspendido",
    CANCELLED: "Cancelado",
    MANUAL: "Activación manual",
  };

  return labels[status] ?? status;
}

function formatDate(date?: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function ActivationPage({ params }: ActivationPageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug,
    },
    include: {
      subscription: true,
    },
  });

  if (!restaurant) {
    notFound();
  }

  const trialEndsAt = formatDate(restaurant.trialEndsAt);
  const graceUntil = formatDate(restaurant.graceUntil);

  const publicUrl = `https://${restaurant.subdomain}`;
  const supportWhatsapp = process.env.MENUI_SUPPORT_WHATSAPP ?? "";
  const supportUrl = supportWhatsapp
    ? `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(
        `Hola, necesito ayuda para activar el restaurante ${restaurant.name} en Menui.`
      )}`
    : null;

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <div className={styles.logoMark}>M</div>

        <span className={styles.eyebrow}>Activación Menui</span>

        <h1>Tu menú ya está creado.</h1>

        <p>
          El restaurante <strong>{restaurant.name}</strong> ya tiene su espacio
          en Menui. Para usar el panel completo y mantener el menú operativo,
          completá la activación.
        </p>

        <div className={styles.statusGrid}>
          <article>
            <span>Estado actual</span>
            <strong>{getStatusLabel(restaurant.status)}</strong>
          </article>

          <article>
            <span>Subdominio</span>
            <strong>{restaurant.subdomain}</strong>
          </article>

          <article>
            <span>Plan</span>
            <strong>{restaurant.subscription?.planId ?? "basic"}</strong>
          </article>

          <article>
            <span>Monto mensual</span>
            <strong>
              {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
              }).format(restaurant.subscription?.amountArs ?? 0)}
            </strong>
          </article>
        </div>

        {restaurant.status === "TRIAL" ? (
          <div className={styles.notice}>
            <strong>Prueba gratuita</strong>
            <p>
              {trialEndsAt
                ? `Tu prueba gratuita vence el ${trialEndsAt}.`
                : "Este restaurante está en prueba gratuita, pero todavía no tiene fecha de vencimiento configurada."}
            </p>
          </div>
        ) : null}

        {restaurant.status === "PAST_DUE" ? (
          <div className={styles.noticeDanger}>
            <strong>Pago pendiente</strong>
            <p>
              {graceUntil
                ? `Tenés margen hasta el ${graceUntil} para regularizar el pago.`
                : "Regularizá el pago para recuperar el acceso completo."}
            </p>
          </div>
        ) : null}

        {restaurant.status === "SUSPENDED" || restaurant.status === "CANCELLED" ? (
          <div className={styles.noticeDanger}>
            <strong>Acceso pausado</strong>
            <p>
              El acceso a este restaurante está pausado. Contactá soporte para
              revisar la activación.
            </p>
          </div>
        ) : null}

        <div className={styles.actions}>
          <a className={styles.primaryButton} href={`/contratar?slug=${restaurant.slug}`}>
            Activar con Mercado Pago
          </a>

          <a className={styles.secondaryButton} href={publicUrl} target="_blank">
            Ver menú público
          </a>

          {supportUrl ? (
            <a className={styles.secondaryButton} href={supportUrl} target="_blank">
              Hablar con soporte
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}