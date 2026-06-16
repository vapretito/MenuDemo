"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./page.module.css";
import { MENUI_TRIAL_DAYS, menuiLegalHighlights } from "@/data/legal";

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
    name: "Menui Basic",
    price: "$20.000 ARS / mes",
    description: "Plan comercial base para restaurantes.",
  },
  // {
  //   id: "test_real",
  //   name: "Menui Test Real",
  //   price: "$500 ARS / mes",
  //   description: "Plan interno para probar Mercado Pago con dinero real.",
  // },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizeWhatsapp = (value: string) => value.replace(/\D/g, "").slice(0, 15);
const ARGENTINA_PREFIX = "54";
const LOCAL_WHATSAPP_MAX_LENGTH = 13;

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
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const suggestedSlug = useMemo(
    () => slugify(form.slug || form.restaurantName),
    [form.restaurantName, form.slug]
  );
  const generatedSubdomain = suggestedSlug ? `${suggestedSlug}.menui.online` : "";
  const fullWhatsapp = `${ARGENTINA_PREFIX}${form.whatsapp}`;

  const updateField = (name: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitOnboarding = async () => {
    if (!acceptedLegal) {
      setError(
        "Tenes que aceptar los terminos y la politica de privacidad para continuar."
      );
      return;
    }

    if (form.whatsapp.length < 8 || form.whatsapp.length > LOCAL_WHATSAPP_MAX_LENGTH) {
      setError(
        "El WhatsApp del local debe completarse despues del +54 y tener entre 8 y 13 digitos."
      );
      return;
    }

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
          whatsapp: fullWhatsapp,
          slug: suggestedSlug,
          acceptedLegal,
        }),
      });

      const rawResponse = await response.text();

      let data: OnboardingResult & {
        error?: string;
      };

      try {
        data = JSON.parse(rawResponse);
      } catch {
        throw new Error(`La API no devolvio JSON. Status: ${response.status}.`);
      }

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo iniciar el alta.");
      }

      setResult(data);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "No se pudo iniciar el alta automatica."
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
          <h1>{result.restaurant.name} ya esta preparado.</h1>
          <p>Ahora falta completar el pago para activar el menu y el panel admin.</p>

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
            <p>Guardalas ahora. La contrasena se muestra una sola vez en esta pantalla.</p>
            <strong>Email: {result.credentials.email}</strong>
            <strong>Contrasena: {result.credentials.temporaryPassword}</strong>
          </div>

          <a className={styles.primaryButton} href={result.checkoutUrl || result.paymentUrl}>
            Continuar a Mercado Pago
          </a>

          <Link className={styles.secondaryLink} href="/">
            Volver a Menui
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.brandPanel}>
        <div>
          <span className={styles.eyebrow}>Alta automatica</span>
          <h1>Crea tu app menu y activala con Mercado Pago.</h1>
          <p>
            Completa los datos del restaurante, elegi un plan y genera el acceso
            inicial. El menu se activa cuando se confirma el pago.
          </p>

          <div className={styles.summaryCard}>
            <strong>Condiciones basicas antes de activar</strong>
            <ul>
              {menuiLegalHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
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
              onChange={(event) => updateField("restaurantName", event.target.value)}
              placeholder="Pizzeria Roma"
            />
          </label>

          <label>
            <span>Responsable</span>
            <input
              value={form.ownerName}
              onChange={(event) => updateField("ownerName", event.target.value)}
              placeholder="Juan Perez"
            />
          </label>

          <label>
            <span>Email del responsable</span>
            <input
              type="email"
              value={form.ownerEmail}
              onChange={(event) => updateField("ownerEmail", event.target.value)}
              placeholder="dueno@email.com"
            />
            <small className={styles.fieldHelp}>
              Este email debe pertenecer a la cuenta de Mercado Pago que va a pagar la
              suscripcion.
            </small>
          </label>

          <label>
            <span>WhatsApp del local</span>
            <div className={styles.phoneInput}>
              <span className={styles.phonePrefix}>+54</span>
              <input
                value={form.whatsapp}
                onChange={(event) =>
                  updateField(
                    "whatsapp",
                    normalizeWhatsapp(event.target.value).slice(0, LOCAL_WHATSAPP_MAX_LENGTH)
                  )
                }
                placeholder="93510000000"
                inputMode="numeric"
                maxLength={LOCAL_WHATSAPP_MAX_LENGTH}
              />
            </div>
            <small className={styles.fieldHelp}>
              Tiene que ser el numero real del WhatsApp donde reciben los pedidos del
              delivery. Vos completas solo el prefijo y numero local: el +54 ya viene fijo.
            </small>
          </label>

          <label>
            <span>Ciudad</span>
            <input
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              placeholder="Cordoba"
            />
          </label>

          <label>
            <span>Tipo de comida</span>
            <input
              value={form.cuisine}
              onChange={(event) => updateField("cuisine", event.target.value)}
              placeholder="Pizzas, hamburguesas, cafeteria..."
            />
          </label>

          <label>
            <span>Subdominio deseado</span>
            <input
              value={form.slug}
              onChange={(event) => updateField("slug", event.target.value)}
              placeholder="pizzeria-roma"
            />
            <small className={styles.fieldHelp}>
              Este seria el nombre base del subdominio de tu restaurante dentro de Menui.
            </small>
          </label>

          <label>
            <span>Subdominio generado</span>
            <input
              readOnly
              value={generatedSubdomain}
              placeholder="restaurante.menui.online"
            />
            <small className={styles.fieldHelpStrong}>
              Tu subdominio quedaria asi:{" "}
              <strong>{generatedSubdomain || "nombre.menui.online"}</strong>
            </small>
          </label>
        </div>

        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <button
              key={plan.id}
              className={form.planId === plan.id ? styles.planCardActive : styles.planCard}
              onClick={() => updateField("planId", plan.id)}
              type="button"
            >
              {plan.id === "test_real" ? (
                <small>Prueba real</small>
              ) : (
                <small>Plan comercial</small>
              )}

              <strong>{plan.name}</strong>
              <span>{plan.price}</span>
              <p>{plan.description}</p>
            </button>
          ))}
        </div>

        <section className={styles.legalCard} aria-label="Condiciones legales basicas">
          <strong>Antes de continuar</strong>
          <ul className={styles.legalList}>
            {menuiLegalHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(event) => setAcceptedLegal(event.target.checked)}
            />
            <span>
              Acepto los <Link href="/terminos">Terminos y condiciones</Link> y la{" "}
              <Link href="/privacidad">Politica de privacidad</Link>, incluyendo el
              trial de {MENUI_TRIAL_DAYS} dias y la renovacion mensual.
            </span>
          </label>
        </section>

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
