import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

type ActivationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDateTime(date?: Date | string | null) {
  if (!date) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function getStatusCopy(status: string, trialEndsAt?: Date | null) {
  const normalized = status.toUpperCase();
  const now = Date.now();
  const trialTime = trialEndsAt ? trialEndsAt.getTime() : null;
  const trialIsActive = trialTime ? trialTime > now : false;
  const trialIsExpired = trialTime ? trialTime <= now : false;

  if (normalized === "ACTIVE") {
    return {
      badge: "Activo",
      title: "Tu menú está activo.",
      description:
        "El restaurante ya puede operar normalmente con su menú público y su panel administrativo.",
      tone: "success",
    };
  }

  if (normalized === "MANUAL") {
    return {
      badge: "Activación manual",
      title: "Tu restaurante fue activado manualmente.",
      description:
        "El acceso está habilitado por gestión interna de Menui.",
      tone: "success",
    };
  }

  if (normalized === "TRIAL" && trialIsActive) {
    return {
      badge: "Prueba gratuita",
      title: "Tu prueba gratuita está activa.",
      description:
        "Podés usar el panel y preparar tu menú. Cuando termine el período de prueba, la membresía deberá regularizarse.",
      tone: "info",
    };
  }

  if (normalized === "TRIAL" && trialIsExpired) {
    return {
      badge: "Prueba finalizada",
      title: "Tu período de prueba terminó.",
      description:
        "Para continuar usando Menui, será necesario regularizar la membresía del restaurante.",
      tone: "warning",
    };
  }

  if (normalized === "PAST_DUE") {
    return {
      badge: "Pago pendiente",
      title: "Tu membresía requiere atención.",
      description:
        "Hay un pago pendiente o no se pudo validar la membresía. Regularizá el acceso para continuar operando.",
      tone: "warning",
    };
  }

  if (normalized === "SUSPENDED") {
    return {
      badge: "Suspendido",
      title: "El acceso está pausado.",
      description:
        "El restaurante está suspendido temporalmente. Contactá a soporte para revisar la situación.",
      tone: "danger",
    };
  }

  if (normalized === "CANCELLED") {
    return {
      badge: "Cancelado",
      title: "La membresía fue cancelada.",
      description:
        "Para volver a usar Menui, será necesario reactivar el restaurante.",
      tone: "danger",
    };
  }

  return {
    badge: "Pendiente",
    title: "Tu restaurante está pendiente de activación.",
    description:
      "El menú fue creado correctamente, pero todavía falta completar la activación.",
    tone: "info",
  };
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

  const statusCopy = getStatusCopy(restaurant.status, restaurant.trialEndsAt);

  const publicUrl = `https://${restaurant.subdomain}`;
  const loginUrl = `https://${restaurant.subdomain}/login`;
  const adminUrl = `https://${restaurant.subdomain}/admin`;

  const supportWhatsapp = process.env.MENUI_SUPPORT_WHATSAPP ?? "";
  const supportUrl = supportWhatsapp
    ? `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(
        `Hola, necesito ayuda para activar el restaurante ${restaurant.name} en Menui.`
      )}`
    : null;

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.logoMark}>M</div>

          <div>
            <span className={styles.eyebrow}>Activación Menui</span>
            <p>Estado operativo del restaurante</p>
          </div>
        </div>

        <div className={`${styles.statusHero} ${styles[statusCopy.tone]}`}>
          <span>{statusCopy.badge}</span>
          <h1>{statusCopy.title}</h1>
          <p>{statusCopy.description}</p>
        </div>

        <section className={styles.restaurantBlock}>
          <span className={styles.eyebrow}>Restaurante</span>
          <h2>{restaurant.name}</h2>
          <p>{restaurant.description}</p>
        </section>

        <section className={styles.infoGrid}>
          <article>
            <span>Estado</span>
            <strong>{restaurant.status.toLowerCase()}</strong>
          </article>

          <article>
            <span>Plan</span>
            <strong>{restaurant.subscription?.planName ?? "Sin plan"}</strong>
          </article>

          <article>
            <span>Débito mensual</span>
            <strong>{formatMoney(restaurant.subscription?.amountArs)}</strong>
          </article>

          <article>
            <span>Trial hasta</span>
            <strong>{formatDateTime(restaurant.trialEndsAt)}</strong>
          </article>

          <article>
            <span>Renovación</span>
            <strong>{formatDateTime(restaurant.subscription?.renewsOn)}</strong>
          </article>

          <article>
            <span>Subdominio</span>
            <strong>{restaurant.subdomain}</strong>
          </article>
        </section>

        <section className={styles.noteBox}>
          <strong>Importante</strong>
          <p>
            Los días de prueba se otorgan una sola vez. Si el trial finalizó o
            la membresía queda pendiente, el acceso completo puede requerir
            regularización.
          </p>
        </section>

        <div className={styles.actions}>
          <a className={styles.primaryButton} href={publicUrl} target="_blank">
            Ver menú público
          </a>

          <a className={styles.secondaryButton} href={loginUrl} target="_blank">
            Ir al login
          </a>

          <a className={styles.secondaryButton} href={adminUrl} target="_blank">
            Intentar abrir admin
          </a>

          {supportUrl ? (
            <a className={styles.secondaryButton} href={supportUrl} target="_blank">
              Hablar con soporte
            </a>
          ) : null}
        </div>

        <p className={styles.footerNote}>
          La integración de pago y sincronización automática con Mercado Pago se
          terminará en una etapa posterior.
        </p>
      </section>
    </main>
  );
}