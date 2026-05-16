import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type ActivatePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default async function ActivatePage({ params }: ActivatePageProps) {
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

  const subscription = restaurant.subscription;
  const checkoutUrl = subscription?.mercadopagoInitPoint ?? null;
  const isActive = restaurant.status === "ACTIVE";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
        background: "#f4f6f8",
        color: "#111827",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "560px",
          display: "grid",
          gap: "1rem",
          padding: "1.25rem",
          border: "1px solid #d7dce5",
          background: "#ffffff",
        }}
      >
        <div>
          <span
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#667085",
              fontSize: "0.72rem",
              fontWeight: 800,
            }}
          >
            Menui membresía
          </span>

          <h1
            style={{
              margin: "0.4rem 0 0",
              fontSize: "2rem",
              lineHeight: 1,
            }}
          >
            Activar {restaurant.name}
          </h1>

          <p style={{ color: "#667085", lineHeight: 1.6 }}>
            Completá el pago mensual para activar el menú, el subdominio y el
            panel admin del restaurante.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "0.5rem",
            padding: "1rem",
            border: "1px solid #d7dce5",
            background: "#f8fafc",
          }}
        >
          <span style={{ color: "#667085" }}>Plan</span>
          <strong>{subscription?.planName ?? "Menui"}</strong>

          <span style={{ color: "#667085" }}>Monto mensual</span>
          <strong>{money.format(subscription?.amountArs ?? 0)}</strong>

          <span style={{ color: "#667085" }}>Subdominio</span>
          <strong>{restaurant.subdomain}</strong>

          <span style={{ color: "#667085" }}>Estado</span>
          <strong>{restaurant.status}</strong>
        </div>

        {isActive ? (
          <Link
            href={`https://${restaurant.subdomain}/admin`}
            style={{
              display: "inline-flex",
              minHeight: "3rem",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #047857",
              background: "#ecfdf3",
              color: "#047857",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Ir al admin
          </Link>
        ) : checkoutUrl ? (
          <a
            href={checkoutUrl}
            style={{
              display: "inline-flex",
              minHeight: "3rem",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #1d4ed8",
              background: "#1d4ed8",
              color: "#ffffff",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Pagar con Mercado Pago
          </a>
        ) : (
          <p
            style={{
              margin: 0,
              padding: "0.85rem",
              border: "1px solid #fecdca",
              background: "#fff1f0",
              color: "#b42318",
              fontWeight: 700,
            }}
          >
            Todavía no hay un link de Mercado Pago generado para este
            restaurante.
          </p>
        )}

        <Link
          href="/"
          style={{
            color: "#344054",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          ← Volver a Menui
        </Link>
      </section>
    </main>
  );
}