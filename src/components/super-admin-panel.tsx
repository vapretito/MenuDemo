"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./super-admin-panel.module.css";
import { platformSnapshot } from "@/data/platform";
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

type SuperAdminView = "dashboard" | "restaurants" | "billing";

const sidebarItems: Array<{
  id: SuperAdminView;
  label: string;
  description: string;
}> = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Resumen general",
  },
  {
    id: "restaurants",
    label: "Restaurantes",
    description: "Clientes y demos",
  },
  {
    id: "billing",
    label: "Membresías",
    description: "Mercado Pago",
  },
];




export function SuperAdminPanel() {
  const [restaurants, setRestaurants] = useState<RestaurantRecord[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [form, setForm] = useState<RestaurantCreationInput>(defaultForm);
  const [activeView, setActiveView] = useState<SuperAdminView>("dashboard");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [mpPayerEmail, setMpPayerEmail] = useState("");
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState<string | null>(null);
  const [mpSubscriptionId, setMpSubscriptionId] = useState<string | null>(null);

  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [backofficeError, setBackofficeError] = useState<string | null>(null);

  const selectedRestaurant = useMemo(() => {
    return (
      restaurants.find((restaurant) => restaurant.slug === selectedSlug) ??
      restaurants[0] ??
      null
    );
  }, [restaurants, selectedSlug]);

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

  const loadRestaurants = async () => {
    setIsLoadingRestaurants(true);
    setBackofficeError(null);

    try {
      const response = await fetch("/api/backoffice/restaurants", {
        cache: "no-store",
      });

      const rawResponse = await response.text();

      let data: {
        restaurants?: RestaurantRecord[];
        error?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          `La API no devolvió JSON. Status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudieron cargar restaurantes.");
      }

      const nextRestaurants = data.restaurants ?? [];

      setRestaurants(nextRestaurants);
      setSelectedSlug(nextRestaurants[0]?.slug ?? "");
    } catch (error) {
      setBackofficeError(
        error instanceof Error
          ? error.message
          : "Error cargando restaurantes."
      );
    } finally {
      setIsLoadingRestaurants(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const createRestaurant = async () => {
    if (
      !form.name ||
      !form.slug ||
      !form.subdomain ||
      !form.city ||
      !form.customerWhatsapp
    ) {
      setBackofficeError("Completá nombre, slug, subdominio, ciudad y WhatsApp.");
      return;
    }

    setBackofficeError(null);

    try {
      const response = await fetch("/api/backoffice/restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          slug: form.slug.toLowerCase().trim(),
          subdomain: form.subdomain.toLowerCase().trim(),
        }),
      });

      const rawResponse = await response.text();

      let data: {
        restaurant?: RestaurantRecord;
        error?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          `La API no devolvió JSON. Status: ${response.status}.`
        );
      }

      if (!response.ok || !data.restaurant) {
        throw new Error(data.error ?? "No se pudo crear el restaurante.");
      }

      setRestaurants((current) => [data.restaurant as RestaurantRecord, ...current]);
      setSelectedSlug(data.restaurant.slug);
      setForm(defaultForm);
      setIsCreateOpen(false);
      setActiveView("restaurants");
    } catch (error) {
      setBackofficeError(
        error instanceof Error
          ? error.message
          : "Error creando restaurante."
      );
    }
  };

  const deleteRestaurant = async (slug: string) => {
    const target = restaurants.find((restaurant) => restaurant.slug === slug);

    if (!target) return;

    setBackofficeError(null);

    try {
      const response = await fetch(`/api/backoffice/restaurants/${target.id}`, {
        method: "DELETE",
      });

      const rawResponse = await response.text();

      let data: {
        error?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          `La API no devolvió JSON. Status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo borrar el restaurante.");
      }

      setRestaurants((current) => {
        const next = current.filter((restaurant) => restaurant.slug !== slug);

        if (selectedSlug === slug) {
          setSelectedSlug(next[0]?.slug ?? "");
        }

        return next;
      });
    } catch (error) {
      setBackofficeError(
        error instanceof Error ? error.message : "Error borrando restaurante."
      );
    }
  };

  const markDnsConfigured = async (slug: string) => {
    const target = restaurants.find((restaurant) => restaurant.slug === slug);

    if (!target) return;

    setBackofficeError(null);

    try {
      const response = await fetch(`/api/backoffice/restaurants/${target.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dnsStatus: "configured",
        }),
      });

      const rawResponse = await response.text();

      let data: {
        restaurant?: RestaurantRecord;
        error?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          `La API no devolvió JSON. Status: ${response.status}.`
        );
      }

      if (!response.ok || !data.restaurant) {
        throw new Error(data.error ?? "No se pudo actualizar DNS.");
      }

      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant.id === target.id ? data.restaurant as RestaurantRecord : restaurant
        )
      );
    } catch (error) {
      setBackofficeError(
        error instanceof Error ? error.message : "Error actualizando DNS."
      );
    }
  };

  const setRestaurantStatus = async (
    slug: string,
    status: RestaurantRecord["status"]
  ) => {
    const target = restaurants.find((restaurant) => restaurant.slug === slug);

    if (!target) return;

    setBackofficeError(null);

    try {
      const response = await fetch(`/api/backoffice/restaurants/${target.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      const rawResponse = await response.text();

      let data: {
        restaurant?: RestaurantRecord;
        error?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          `La API no devolvió JSON. Status: ${response.status}.`
        );
      }

      if (!response.ok || !data.restaurant) {
        throw new Error(data.error ?? "No se pudo actualizar estado.");
      }

      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant.id === target.id ? data.restaurant as RestaurantRecord : restaurant
        )
      );
    } catch (error) {
      setBackofficeError(
        error instanceof Error ? error.message : "Error actualizando estado."
      );
    }
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
          restaurantSlug: selectedRestaurant.slug,
          restaurantName: selectedRestaurant.name,
          planName: selectedRestaurant.subscription.plan,
          amountArs: selectedRestaurant.subscription.amountArs,
          payerEmail,
        }),
      });

      const rawResponse = await response.text();

      let data: {
        id?: string;
        initPoint?: string;
        publicPaymentUrl?: string;
        error?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          `La API no devolvió JSON. Status: ${response.status}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo crear la suscripción.");
      }

      setMpCheckoutUrl(data.publicPaymentUrl ?? data.initPoint ?? null);
      setMpSubscriptionId(data.id ?? null);

      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant.id === selectedRestaurant.id
            ? {
                ...restaurant,
                billingMode: "mercado_pago_subscription",
                subscription: {
                  ...restaurant.subscription,
                  mercadopagoPreapprovalId: data.id ?? "pendiente",
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

  if (isLoadingRestaurants) {
    return (
      <div className={styles.shell}>
        <section className={styles.content}>
          <div className={styles.panelSection}>
            <span className={styles.eyebrow}>Backoffice</span>
            <h3>Cargando restaurantes...</h3>
          </div>
        </section>
      </div>
    );
  }

  if (backofficeError && restaurants.length === 0) {
    return (
      <div className={styles.shell}>
        <section className={styles.content}>
          <div className={styles.errorBox}>{backofficeError}</div>
        </section>
      </div>
    );
  }

  if (!selectedRestaurant) {
    return (
      <div className={styles.shell}>
        <section className={styles.content}>
          <div className={styles.panelSection}>
            <span className={styles.eyebrow}>Restaurantes</span>
            <h3>No hay restaurantes cargados</h3>
            <p>Creá el primer restaurante desde el botón “Agregar restaurante”.</p>
            <button
              className={styles.actionButton}
              onClick={() => {
                setActiveView("restaurants");
                setIsCreateOpen(true);
              }}
              type="button"
            >
              Agregar restaurante
            </button>
          </div>
        </section>
      </div>
    );
  }
  
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.logoBox}>M</div>
          <div>
            <strong>Menui</strong>
            <span>Control Center</span>
          </div>
        </div>
  
        <nav className={styles.sideNav}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={
                activeView === item.id
                  ? styles.sideNavButtonActive
                  : styles.sideNavButton
              }
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </nav>
  
        <button
          className={styles.sidebarPrimaryButton}
          onClick={() => {
            setActiveView("restaurants");
            setIsCreateOpen(true);
          }}
          type="button"
        >
          + Agregar restaurante
        </button>
  
        <div className={styles.sidebarFooter}>
          <span>Dominio principal</span>
          <strong>menui.online</strong>
        </div>
      </aside>
  
      <section className={styles.content}>
      {backofficeError ? (
  <div className={styles.errorBox}>{backofficeError}</div>
) : null}

{isLoadingRestaurants ? (
  <div className={styles.panelSection}>Cargando restaurantes...</div>
) : null}
        <header className={styles.contentHeader}>
          <div>
            <span className={styles.eyebrow}>
              {activeView === "dashboard"
                ? "Resumen"
                : activeView === "restaurants"
                  ? "Gestión comercial"
                  : "Cobros y suscripciones"}
            </span>
            <h2>
              {activeView === "dashboard"
                ? "Dashboard"
                : activeView === "restaurants"
                  ? "Restaurantes"
                  : "Membresías"}
            </h2>
          </div>
  
          <div className={styles.headerActions}>
            <span className={styles.statusBadge}>Backoffice activo</span>
  
            {activeView === "restaurants" ? (
              <button
                className={styles.actionButton}
                onClick={() => setIsCreateOpen((current) => !current)}
                type="button"
              >
                {isCreateOpen ? "Cerrar formulario" : "Agregar restaurante"}
              </button>
            ) : null}
          </div>
        </header>
  
        {activeView === "dashboard" ? (
          <div className={styles.viewStack}>
            <section className={styles.hero}>
              <div>
                <span className={styles.eyebrow}>Menui SaaS</span>
                <h1>Centro de control para menús, subdominios y membresías.</h1>
                <p>
                  Desde este panel podés crear restaurantes, controlar estados de
                  activación, revisar subdominios y preparar la operación mensual
                  de cada cliente.
                </p>
              </div>
  
              <div className={styles.heroStats}>
                <article>
                  <strong>{restaurants.length}</strong>
                  <span>restaurantes cargados</span>
                </article>
                <article>
                  <strong>{stats.activeCount}</strong>
                  <span>activos</span>
                </article>
                <article>
                  <strong>{stats.configuredCount}</strong>
                  <span>subdominios configurados</span>
                </article>
              </div>
            </section>
  
            <section className={styles.kpiGrid}>
              <article className={styles.kpiCard}>
                <span>Pedidos de referencia</span>
                <strong>{stats.totalOrders}</strong>
              </article>
  
              <article className={styles.kpiCard}>
                <span>MRR estimado</span>
                <strong>{money.format(stats.monthlyRecurring)}</strong>
              </article>
  
              <article className={styles.kpiCard}>
                <span>Demo pública</span>
                <strong>demo.menui.online</strong>
              </article>
  
              <article className={styles.kpiCard}>
                <span>Backoffice</span>
                <strong>menui.online/backoffice</strong>
              </article>
            </section>
  
            <section className={styles.panelSection}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>Arquitectura</span>
                  <h3>Flujo actual de Menui</h3>
                </div>
              </div>
  
              <div className={styles.infoGrid}>
                <article>
                  <span>Landing</span>
                  <strong>menui.online</strong>
                  <p>Clientes entran, ven el servicio y te contactan.</p>
                </article>
  
                <article>
                  <span>Demo</span>
                  <strong>demo.menui.online</strong>
                  <p>Demo pública con carrito y pedido por WhatsApp.</p>
                </article>
  
                <article>
                  <span>Admin restaurante</span>
                  <strong>demo.menui.online/admin</strong>
                  <p>Panel del restaurante para editar productos y categorías.</p>
                </article>
  
                <article>
                  <span>Superadmin</span>
                  <strong>menui.online/backoffice</strong>
                  <p>Panel privado para administrar clientes y membresías.</p>
                </article>
              </div>
            </section>
          </div>
        ) : null}
  
        {activeView === "restaurants" ? (
          <div className={styles.viewStack}>
            {isCreateOpen ? (
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
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
  
                  <label>
                    <span>Slug interno</span>
                    <input
                      placeholder="demo"
                      value={form.slug}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          slug: event.target.value,
                        }))
                      }
                    />
                  </label>
  
                  <label>
                    <span>Subdominio</span>
                    <input
                      placeholder="demo.menui.online"
                      value={form.subdomain}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          subdomain: event.target.value,
                        }))
                      }
                    />
                  </label>
  
                  <label>
                    <span>Ciudad</span>
                    <input
                      value={form.city}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                    />
                  </label>
  
                  <label>
                    <span>Tipo de cocina</span>
                    <input
                      value={form.cuisine}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          cuisine: event.target.value,
                        }))
                      }
                    />
                  </label>
  
                  <label>
                    <span>Responsable</span>
                    <input
                      value={form.adminName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          adminName: event.target.value,
                        }))
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
                          planId:
                            event.target
                              .value as RestaurantCreationInput["planId"],
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
                          status:
                            event.target
                              .value as RestaurantCreationInput["status"],
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
                          billingMode:
                            event.target
                              .value as RestaurantCreationInput["billingMode"],
                        }))
                      }
                    >
                      <option value="mercado_pago_subscription">
                        Mercado Pago
                      </option>
                      <option value="manual">Manual</option>
                    </select>
                  </label>
  
                  <div className={styles.formActions}>
                    <button
                      className={styles.actionButton}
                      onClick={createRestaurant}
                      type="button"
                    >
                      Crear restaurante
                    </button>
  
                    <button
                      className={styles.secondaryAction}
                      onClick={() => setIsCreateOpen(false)}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
  
            <section className={styles.twoColumn}>
              <aside className={styles.panelSection}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>Portfolio</span>
                    <h3>Restaurantes</h3>
                  </div>
                  <span className={styles.countBadge}>{restaurants.length}</span>
                </div>
  
                <div className={styles.restaurantList}>
                  {restaurants.map((restaurant) => (
                    <button
                      className={`${styles.restaurantCard} ${
                        selectedSlug === restaurant.slug
                          ? styles.restaurantCardActive
                          : ""
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
              </aside>
  
              <section className={styles.panelSection}>
                <div className={styles.detailHeader}>
                  <div>
                    <span className={styles.eyebrow}>Ficha operativa</span>
                    <h3>{selectedRestaurant.name}</h3>
                  </div>
  
                  <div className={styles.topRow}>
                    <span className={styles.badge}>
                      {selectedRestaurant.dnsStatus === "configured"
                        ? "DNS configurado"
                        : "DNS pendiente"}
                    </span>
  
                    {!selectedRestaurant.connectedToDemo ? (
                      <button
                        className={styles.deleteButton}
                        onClick={() =>
                          deleteRestaurant(selectedRestaurant.slug)
                        }
                        type="button"
                      >
                        Borrar
                      </button>
                    ) : null}
                  </div>
                </div>
  
                <div className={styles.detailGrid}>
                  <div className={styles.detailCard}>
                    <span>Slug</span>
                    <strong>{selectedRestaurant.slug}</strong>
                  </div>
  
                  <div className={styles.detailCard}>
                    <span>Subdominio</span>
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
                    <span>Renovación</span>
                    <strong>{selectedRestaurant.subscription.renewsOn}</strong>
                  </div>
  
                  <div className={styles.detailCard}>
                    <span>Débito mensual</span>
                    <strong>
                      {money.format(selectedRestaurant.subscription.amountArs)}
                    </strong>
                  </div>
  
                  <div className={styles.detailCard}>
                    <span>WhatsApp</span>
                    <strong>{selectedRestaurant.customerWhatsapp}</strong>
                  </div>
  
                  <div className={`${styles.detailCard} ${styles.full}`}>
                    <span>Mercado Pago</span>
                    <strong>
                      {selectedRestaurant.subscription.mercadopagoPreapprovalId}
                    </strong>
                  </div>
  
                  <div className={`${styles.detailCard} ${styles.full}`}>
                    <span>Descripción operativa</span>
                    <strong>{selectedRestaurant.description}</strong>
                  </div>
                </div>
  
                <div className={styles.detailActions}>
                  {selectedRestaurant.dnsStatus === "pending" ? (
                    <button
                      className={styles.actionButton}
                      onClick={() =>
                        markDnsConfigured(selectedRestaurant.slug)
                      }
                      type="button"
                    >
                      Marcar DNS configurado
                    </button>
                  ) : null}
  
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
        ) : null}
  
        {activeView === "billing" ? (
          <section className={styles.panelSection}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Mercado Pago</span>
                <h3>Membresía del restaurante seleccionado</h3>
              </div>
            </div>
  
            <div className={styles.billingBox}>
              <div>
                <span className={styles.eyebrow}>Restaurante</span>
                <h4>{selectedRestaurant.name}</h4>
                <p>
                  Genera un checkout de suscripción para este restaurante. Más
                  adelante el webhook actualizará el estado automáticamente.
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
  
              {mpError ? (
                <p className={styles.billingError}>{mpError}</p>
              ) : null}
  
              {mpSubscriptionId ? (
                <div className={styles.billingResult}>
                  <span>Preapproval ID</span>
                  <strong>{mpSubscriptionId}</strong>
                </div>
              ) : null}
  
              {mpCheckoutUrl ? (
                <a
                  className={styles.secondaryAction}
                  href={mpCheckoutUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir checkout de Mercado Pago
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}
