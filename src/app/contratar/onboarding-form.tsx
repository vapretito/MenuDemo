"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type OnboardingResult = {
  restaurant: {
    name: string;
    slug: string;
    subdomain: string;
    status: string;
  };
  paymentUrl: string;
  checkoutUrl: string;
  adminUrl: string;
  loginUrl: string;
  credentials: {
    email: string;
    temporaryPassword: string;
  };
};

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "$19.900 ARS / mes",
  },
  {
    id: "pro",
    name: "Growth",
    price: "$39.900 ARS / mes",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$69.900 ARS / mes",
  },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function OnboardingForm() {
  const [form, setForm] = useState({
    restaurantName: "",
    ownerName: "",
    ownerEmail: "",
    whatsapp: "",
    city: "",
    cuisine: "",
    slug: "",
    planId: "basic",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const suggestedSlug = useMemo(
    () => slugify(form.slug || form.restaurantName),
    [form.restaurantName, form.slug]
  );

  const updateField = (name: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitOnboarding = async () => {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/public/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          slug: suggestedSlug,
        }),
      });

      const rawResponse = await response.text();

      let data: OnboardingResult & {
        error?: string;
      };

      try {
        data = JSON.parse(rawResponse);
      } catch {
        throw new Error(
          `La API no devolvió JSON. Status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo iniciar el alta.");
      }

      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar el alta automática."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <main className={styles.shell}>
        <section className={styles.resultCard}>
          <span className={styles.eyebrow}>Alta iniciada</span>
          <h1>{result.restaurant.name} ya está preparado.</h1>
          <p>
            Ahora falta completar el pago para activar el menú y el panel admin.
          </p>

          <div className={styles.infoBox}>
            <span>Subdominio</span>
            <strong>{result.restaurant.subdomain}</strong>

            <span>Login</span>
            <strong>{result.loginUrl}</strong>

            <span>Admin</span>
            <strong>{result.adminUrl}</strong>
          </div>

          <div className={styles.credentialsBox}>
            <span>Credenciales temporales</span>
            <p>
              Guardalas ahora. La contraseña se muestra una sola vez en esta
              pantalla.
            </p>
            <strong>Email: {result.credentials.email}</strong>
            <strong>Contraseña: {result.credentials.temporaryPassword}</strong>
          </div>

          <a className={styles.primaryButton} href={result.paymentUrl}>
            Continuar al pago
          </a>

          <a className={styles.secondaryLink} href="/">
            Volver a Menui
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.brandPanel}>
        <div>
          <span className={styles.eyebrow}>Alta automática</span>
          <h1>Creá tu app menú y activala con Mercado Pago.</h1>
          <p>
            Completá los datos del restaurante, elegí un plan y generá el acceso
            inicial. El menú se activa cuando se confirma el pago.
          </p>
        </div>
      </section>

      <section className={styles.formCard}>
        <div>
          <span className={styles.eyebrow}>Datos del restaurante</span>
          <h2>Empezar alta</h2>
        </div>

        <div className={styles.formGrid}>
          <label>
            <span>Nombre del restaurante</span>
            <input
              value={form.restaurantName}
              onChange={(event) =>
                updateField("restaurantName", event.target.value)
              }
              placeholder="Pizzería Roma"
            />
          </label>

          <label>
            <span>Responsable</span>
            <input
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              placeholder="Juan Pérez"
            />
          </label>

          <label>
            <span>Email del responsable</span>
            <input
              type="email"
              value={form.ownerEmail}
              onChange={(event) =>
                updateField("ownerEmail", event.target.value)
              }
              placeholder="dueno@email.com"
            />
          </label>

          <label>
            <span>WhatsApp del local</span>
            <input
              value={form.whatsapp}
              onChange={(event) => updateField("whatsapp", event.target.value)}
              placeholder="5493510000000"
            />
          </label>

          <label>
            <span>Ciudad</span>
            <input
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              placeholder="Córdoba"
            />
          </label>

          <label>
            <span>Tipo de comida</span>
            <input
              value={form.cuisine}
              onChange={(event) => updateField("cuisine", event.target.value)}
              placeholder="Pizzas, hamburguesas, cafetería..."
            />
          </label>

          <label>
            <span>Slug deseado</span>
            <input
              value={form.slug}
              onChange={(event) => updateField("slug", event.target.value)}
              placeholder="pizzeria-roma"
            />
          </label>

          <label>
            <span>Subdominio generado</span>
            <input
              readOnly
              value={suggestedSlug ? `${suggestedSlug}.menui.online` : ""}
              placeholder="restaurante.menui.online"
            />
          </label>
        </div>

        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <button
              key={plan.id}
              className={
                form.planId === plan.id
                  ? styles.planCardActive
                  : styles.planCard
              }
              onClick={() => updateField("planId", plan.id)}
              type="button"
            >
              <strong>{plan.name}</strong>
              <span>{plan.price}</span>
            </button>
          ))}
        </div>

        {error ? <p className={styles.errorBox}>{error}</p> : null}

        <button
          className={styles.primaryButton}
          disabled={isLoading}
          onClick={submitOnboarding}
          type="button"
        >
          {isLoading ? "Creando alta..." : "Crear y continuar"}
        </button>
      </section>
    </main>
  );
}