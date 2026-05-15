"use client";

import { useMemo, useState } from "react";
import styles from "./super-admin-panel.module.css";
import { planCatalog, platformSnapshot } from "@/data/platform";
import { RestaurantCreationInput, RestaurantRecord } from "@/types/platform";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const defaultForm: RestaurantCreationInput = {
  name: "",
  slug: "",
  subdomain: "",
  city: "",
  cuisine: "",
  adminName: "",
  customerWhatsapp: "",
  planId: "basic",
  status: "trial",
  billingMode: "mercado_pago_subscription",
};

const buildRestaurant = (input: RestaurantCreationInput): RestaurantRecord => {
  const selectedPlan = planCatalog.find((plan) => plan.id === input.planId) ?? planCatalog[0];
  const isManual = input.billingMode === "manual";

  return {
    id: `rest-${Date.now()}`,
    name: input.name,
    slug: input.slug,
    subdomain: input.subdomain,
    dnsStatus: "pending",
    connectedToDemo: false,
    billingMode: input.billingMode,
    city: input.city,
    cuisine: input.cuisine,
    description:
      "Nuevo restaurante cargado desde backoffice y listo para personalizar sobre la base del producto.",
    status: input.status,
    adminName: input.adminName,
    adminWhatsapp: input.customerWhatsapp,
    customerWhatsapp: input.customerWhatsapp,
    onboardingNote: isManual
      ? "Cliente cargado con modalidad manual. Subdominio y cobro se gestionan por fuera del flujo automatico."
      : "Subdominio cargado manualmente. Pendiente de confirmar configuracion en Hostinger y activar branding final.",
    graceUntil: input.status === "past_due" ? "2026-06-08" : null,
    subscription: {
      planId: selectedPlan.id,
      plan: selectedPlan.name,
      amountArs: selectedPlan.price,
      cycle: "monthly",
      mercadopagoPreapprovalId: isManual ? "manual" : "pendiente",
      collectionMethod: isManual ? "manual" : "automatic",
      status: input.status === "active" ? "active" : "scheduled",
      renewsOn: "2026-06-01",
    },
    metrics: {
      monthlyOrders: 0,
      monthlyRevenueArs: 0,
      conversionRate: 0,
    },
    theme: {
      accent: "#f0c400",
      accentSoft: "#fff1ac",
      surface: "#fffdf7",
      surfaceAlt: "#f4f2e8",
      border: "#1f4723",
      text: "#162218",
      muted: "#58705c",
      heroGradient: "linear-gradient(180deg, #2f7f3a 0%, #1f4723 100%)",
    },
    categories: [],
    items: [],
  };
};


export function SuperAdminPanel() {
  const [restaurants, setRestaurants] = useState(platformSnapshot.restaurants);
  const [selectedSlug, setSelectedSlug] = useState(
    platformSnapshot.restaurants[0]?.slug ?? ""
  );
  const [form, setForm] = useState<RestaurantCreationInput>(defaultForm);
  
  const [mpPayerEmail, setMpPayerEmail] = useState("");
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState<string | null>(null);
  const [mpSubscriptionId, setMpSubscriptionId] = useState<string | null>(null);

  const selectedRestaurant =
    restaurants.find((restaurant) => restaurant.slug === selectedSlug) ?? restaurants[0];

  const stats = useMemo(() => {
    const activeCount = restaurants.filter(
      (restaurant) => restaurant.status === "active"
    ).length;
    const monthlyRecurring = restaurants.reduce(
      (sum, restaurant) => sum + restaurant.subscription.amountArs,
      0
    );
    const totalOrders = restaurants.reduce(
      (sum, restaurant) => sum + restaurant.metrics.monthlyOrders,
      0
    );
    const configuredCount = restaurants.filter(
      (restaurant) => restaurant.dnsStatus === "configured"
    ).length;

    return { activeCount, monthlyRecurring, totalOrders, configuredCount };
  }, [restaurants]);

  const createRestaurant = () => {
    if (
      !form.name ||
      !form.slug ||
      !form.subdomain ||
      !form.city ||
      !form.customerWhatsapp
    ) {
      return;
    }

    const nextRestaurant = buildRestaurant(form);
    setRestaurants((current) => [...current, nextRestaurant]);
    setSelectedSlug(nextRestaurant.slug);
    setForm(defaultForm);
  };

  const deleteRestaurant = (slug: string) => {
    setRestaurants((current) => {
      if (current.length === 1) return current;

      const next = current.filter((restaurant) => restaurant.slug !== slug);

      if (selectedSlug === slug) {
        setSelectedSlug(next[0]?.slug ?? "");
      }

      return next;
    });
  };

  const markDnsConfigured = (slug: string) => {
    setRestaurants((current) =>
      current.map((restaurant) =>
        restaurant.slug === slug
          ? { ...restaurant, dnsStatus: "configured" }
          : restaurant
      )
    );
  };

  const setRestaurantStatus = (slug: string, status: RestaurantRecord["status"]) => {
    setRestaurants((current) =>
      current.map((restaurant) =>
        restaurant.slug === slug
          ? {
              ...restaurant,
              status,
              graceUntil: status === "past_due" ? "2026-06-08" : null,
            }
          : restaurant
      )
    );
  };
  const createMercadoPagoSubscription = async () => {
    if (!selectedRestaurant) return;
  
    const payerEmail = mpPayerEmail.trim();
  
    if (!payerEmail) {
      setMpError("Agregá el email del dueño para generar la suscripción.");
      return;
    }
  
    setMpLoading(true);
    setMpError(null);
    setMpCheckoutUrl(null);
    setMpSubscriptionId(null);
  
    try {
      const response = await fetch("/api/mercadopago/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          restaurantName: selectedRestaurant.name,
          planName: selectedRestaurant.subscription.plan,
          amountArs: selectedRestaurant.subscription.amountArs,
          payerEmail,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la suscripción.");
      }
  
      setMpCheckoutUrl(data.initPoint);
      setMpSubscriptionId(data.id);
  
      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant.id === selectedRestaurant.id
            ? {
                ...restaurant,
                billingMode: "mercado_pago_subscription",
                subscription: {
                  ...restaurant.subscription,
                  mercadopagoPreapprovalId: data.id,
                  collectionMethod: "automatic",
                  status: "scheduled",
                },
                onboardingNote:
                  "Suscripción creada en Mercado Pago. Pendiente de que el restaurante complete el checkout.",
              }
            : restaurant
        )
      );
    } catch (error) {
      setMpError(
        error instanceof Error
          ? error.message
          : "Error generando suscripción de Mercado Pago."
      );
    } finally {
      setMpLoading(false);
    }
  };
  if (!selectedRestaurant) {
    return null;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.listPanel}>
        <section className={styles.panelSection}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Alta comercial</span>
              <h3>Agregar restaurante</h3>
            </div>
          </div>

          <div className={styles.createGrid}>
            <label>
              <span>Nombre</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Slug interno</span>
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Subdominio manual</span>
              <input
                placeholder="subway.menui.oi"
                value={form.subdomain}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subdomain: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Ciudad</span>
              <input
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Tipo de cocina</span>
              <input
                value={form.cuisine}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cuisine: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Responsable</span>
              <input
                value={form.adminName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, adminName: event.target.value }))
                }
              />
            </label>
            <label>
              <span>WhatsApp del local</span>
              <input
                value={form.customerWhatsapp}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerWhatsapp: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Plan</span>
              <select
                value={form.planId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    planId: event.target.value as RestaurantCreationInput["planId"],
                  }))
                }
              >
                {platformSnapshot.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {money.format(plan.price)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Estado inicial</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as RestaurantCreationInput["status"],
                  }))
                }
              >
                <option value="trial">trial</option>
                <option value="active">active</option>
                <option value="past_due">past_due</option>
                <option value="suspended">suspended</option>
                <option value="cancelled">cancelled</option>
                <option value="manual">manual</option>
              </select>
            </label>
            <label>
              <span>Modo de cobro</span>
              <select
                value={form.billingMode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    billingMode: event.target.value as RestaurantCreationInput["billingMode"],
                  }))
                }
              >
                <option value="mercado_pago_subscription">Mercado Pago</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <button className={styles.actionButton} onClick={createRestaurant} type="button">
              Crear restaurante
            </button>
          </div>
        </section>

        <section className={styles.panelSection}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Portfolio</span>
              <h3>Restaurantes activos</h3>
            </div>
          </div>

          <div className={styles.restaurantList}>
            {restaurants.map((restaurant) => (
              <button
                className={`${styles.restaurantCard} ${
                  selectedSlug === restaurant.slug ? styles.restaurantCardActive : ""
                }`}
                key={restaurant.id}
                onClick={() => setSelectedSlug(restaurant.slug)}
                type="button"
              >
                <div>
                  <strong>{restaurant.name}</strong>
                  <span>{restaurant.subdomain}</span>
                </div>
                <small>{restaurant.status}</small>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className={styles.detailPanel}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Backoffice producto</span>
            <h2>Centro de control para subdominios, membresias y activacion comercial.</h2>
            <p>
              En MVP podes usar un link simple de suscripcion de Mercado Pago y activar
              manualmente. El flujo ideal es generar suscripcion, recibir webhook y mover
              estados automaticamente entre `active`, `past_due` o `suspended`.
            </p>
          </div>

          <div className={styles.heroStats}>
            <article>
              <strong>{restaurants.length}</strong>
              <span>restaurantes en plataforma</span>
            </article>
            <article>
              <strong>{stats.activeCount}</strong>
              <span>activos</span>
            </article>
            <article>
              <strong>{stats.configuredCount}</strong>
              <span>subdominios confirmados</span>
            </article>
          </div>
        </section>

        <section className={styles.overviewGrid}>
          <article className={styles.overviewCard}>
            <strong>{stats.totalOrders}</strong>
            <span>pedidos de referencia del mes</span>
          </article>
          <article className={styles.overviewCard}>
            <strong>{selectedRestaurant.subscription.plan}</strong>
            <span>plan actual</span>
          </article>
          <article className={styles.overviewCard}>
            <strong>{selectedRestaurant.status}</strong>
            <span>estado comercial</span>
          </article>
          <article className={styles.overviewCard}>
            <strong>{selectedRestaurant.connectedToDemo ? "SI" : "NO"}</strong>
            <span>conectado a demo publica</span>
          </article>
        </section>

        <section className={styles.panelSection}>
          <div className={styles.detailHeader}>
            <div>
              <span className={styles.eyebrow}>Ficha operativa</span>
              <h3>{selectedRestaurant.name}</h3>
            </div>
            <div className={styles.topRow}>
              <span className={styles.badge}>
                {selectedRestaurant.dnsStatus === "configured"
                  ? "hostinger configurado"
                  : "hostinger pendiente"}
              </span>
              {!selectedRestaurant.connectedToDemo ? (
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteRestaurant(selectedRestaurant.slug)}
                  type="button"
                >
                  Borrar restaurante
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <span>Slug interno</span>
              <strong>{selectedRestaurant.slug}</strong>
            </div>
            <div className={styles.detailCard}>
              <span>Subdominio manual</span>
              <strong>{selectedRestaurant.subdomain}</strong>
            </div>
            <div className={styles.detailCard}>
              <span>Plan</span>
              <strong>{selectedRestaurant.subscription.plan}</strong>
            </div>
            <div className={styles.detailCard}>
              <span>Modo de cobro</span>
              <strong>{selectedRestaurant.billingMode}</strong>
            </div>
            <div className={styles.detailCard}>
              <span>Estado</span>
              <strong>{selectedRestaurant.status}</strong>
            </div>
            <div className={styles.detailCard}>
              <span>Grace until</span>
              <strong>{selectedRestaurant.graceUntil ?? "sin gracia"}</strong>
            </div>
            <div className={styles.detailCard}>
              <span>Debito mensual</span>
              <strong>{money.format(selectedRestaurant.subscription.amountArs)}</strong>
            </div>
            <div className={styles.detailCard}>
              <span>Renovacion</span>
              <strong>{selectedRestaurant.subscription.renewsOn}</strong>
            </div>
            <div className={`${styles.detailCard} ${styles.full}`}>
              <span>Mercado Pago</span>
              <strong>{selectedRestaurant.subscription.mercadopagoPreapprovalId}</strong>
            </div>
            <div className={`${styles.detailCard} ${styles.full}`}>
              <span>Descripcion operativa</span>
              <strong>{selectedRestaurant.description}</strong>
            </div>
          </div>
        </section>

        <section className={styles.callout}>
          <h4>Flujo de cobro recomendado</h4>
          <ul>
            <li>Opcion A MVP: crear plan/link de suscripcion de Mercado Pago, enviarlo al restaurante y activarlo manualmente.</li>
            <li>Flujo ideal: crear restaurante, elegir plan, generar suscripcion, recibir webhook y actualizar estado automaticamente.</li>
            <li>Si el pago entra, mantener `active`. Si falla, pasar a `past_due`. Luego de la gracia, mover a `suspended`.</li>
            <li>`Subway Central` queda como primer restaurante conectado a la demo publica para seguir evolucionando producto real.</li>
          </ul>
          <div className={styles.calloutActions}>
            {selectedRestaurant.dnsStatus === "pending" ? (
              <button
                className={styles.actionButton}
                onClick={() => markDnsConfigured(selectedRestaurant.slug)}
                type="button"
              >
                Marcar Hostinger como configurado
              </button>
            ) : null}
            <div className={styles.billingBox}>
  <div>
    <span className={styles.eyebrow}>Mercado Pago</span>
    <h4>Crear suscripción mensual</h4>
    <p>
      Genera un checkout de suscripción para este restaurante. Por ahora queda en memoria;
      cuando conectemos base real, el webhook va a actualizar el estado automáticamente.
    </p>
  </div>

  <div className={styles.billingGrid}>
    <label>
      <span>Email del dueño</span>
      <input
        className={styles.billingInput}
        placeholder="cliente@email.com"
        type="email"
        value={mpPayerEmail}
        onChange={(event) => setMpPayerEmail(event.target.value)}
      />
    </label>

    <button
      className={styles.actionButton}
      disabled={mpLoading}
      onClick={createMercadoPagoSubscription}
      type="button"
    >
      {mpLoading ? "Generando..." : "Generar suscripción"}
    </button>
  </div>

  {mpError ? <p className={styles.billingError}>{mpError}</p> : null}

  {mpSubscriptionId ? (
    <div className={styles.billingResult}>
      <span>Preapproval ID</span>
      <strong>{mpSubscriptionId}</strong>
    </div>
  ) : null}

  {mpCheckoutUrl ? (
    <a className={styles.secondaryAction} href={mpCheckoutUrl} rel="noreferrer" target="_blank">
      Abrir checkout de Mercado Pago
    </a>
  ) : null}
</div>
            <select
              className={styles.statusSelect}
              value={selectedRestaurant.status}
              onChange={(event) =>
                setRestaurantStatus(
                  selectedRestaurant.slug,
                  event.target.value as RestaurantRecord["status"]
                )
              }
            >
              <option value="trial">trial</option>
              <option value="active">active</option>
              <option value="past_due">past_due</option>
              <option value="suspended">suspended</option>
              <option value="cancelled">cancelled</option>
              <option value="manual">manual</option>
            </select>
          </div>
        </section>
      </section>
    </div>
  );
}
