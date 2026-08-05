"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import styles from "./mobile-menu.module.css";
import {
  RestaurantLogoPosition,
  RestaurantLogoSize,
  RestaurantRecord,
} from "@/types/platform";
import { getRestaurantOpeningStatus } from "@/lib/opening-hours";
import {
  isValidCustomerName,
  normalizeCustomerName,
} from "@/lib/local-ordering";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type LocalOrderingMenuProps = {
  restaurant: RestaurantRecord;
};

type SortMode = "featured" | "price_asc" | "price_desc";

type CartLine = {
  itemId: string;
  quantity: number;
};

const logoSizeClassNames: Record<RestaurantLogoSize, string> = {
  small: "restaurantLogoFixedSizeSmall",
  medium: "restaurantLogoFixedSizeMedium",
  large: "restaurantLogoFixedSizeLarge",
};

const logoPositionClassNames: Record<RestaurantLogoPosition, string> = {
  left: "restaurantLogoFixedPositionLeft",
  center: "restaurantLogoFixedPositionCenter",
  right: "restaurantLogoFixedPositionRight",
};

const buildPageBackground = (
  surface: string,
  surfaceAlt: string,
  accentSoft: string
) =>
  `radial-gradient(circle at top, ${accentSoft}22, transparent 24%), linear-gradient(180deg, ${surface} 0%, ${surfaceAlt} 100%)`;

const extractGradientIntensity = (gradient: string) => {
  const alphaMatches = [...gradient.matchAll(/rgba?\(([^)]+)\)/g)];
  const alphaCandidate = alphaMatches
    .map((match) => match[1]?.split(",").map((part) => part.trim()) ?? [])
    .find((parts) => parts.length === 4);
  const alpha = alphaCandidate ? Number(alphaCandidate[3]) : 0.58;

  return Number.isFinite(alpha)
    ? Math.min(100, Math.max(0, Math.round(alpha * 100)))
    : 58;
};

const getHeroImageOpacity = (intensity: number) => {
  const normalized = Math.min(100, Math.max(0, intensity));
  const opacity = 0.96 - normalized * 0.0056;

  return Math.min(0.96, Math.max(0.38, opacity));
};

const normalizeLogoSize = (value?: string | null): RestaurantLogoSize => {
  if (value === "small" || value === "medium" || value === "large") {
    return value;
  }

  return "medium";
};

const normalizeLogoPosition = (
  value?: string | null
): RestaurantLogoPosition => {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }

  return "left";
};

export function LocalOrderingMenu({ restaurant }: LocalOrderingMenuProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(
    restaurant.categories[0]?.id ?? ""
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const localOrdersEnabled = restaurant.localOrderingEnabled ?? false;
  const openingStatus = getRestaurantOpeningStatus({
    openingHours: restaurant.openingHours,
    timeZone: restaurant.timeZone,
  });
  const canSubmitOrders = localOrdersEnabled && openingStatus.isOpen;
  const requiresWhatsappForReadyNotice =
    restaurant.whatsappReadyNotificationsEnabled ?? false;

  const groupedCategories = useMemo(
    () =>
      restaurant.categories.map((category) => {
        const baseItems = restaurant.items.filter(
          (item) => item.categoryId === category.id
        );
        const filtered = baseItems.filter((item) => {
          if (!query.trim()) return true;
          const normalized = query.trim().toLowerCase();
          return (
            item.name.toLowerCase().includes(normalized) ||
            item.description.toLowerCase().includes(normalized)
          );
        });

        const sorted = [...filtered].sort((left, right) => {
          if (sortMode === "price_asc") return left.price - right.price;
          if (sortMode === "price_desc") return right.price - left.price;
          if (left.featured === right.featured) return 0;
          return left.featured ? -1 : 1;
        });

        return {
          ...category,
          items: sorted,
        };
      }),
    [query, restaurant.categories, restaurant.items, sortMode]
  );

  const visibleCategories = showAllCategories
    ? groupedCategories.filter((category) => category.items.length > 0)
    : groupedCategories.filter(
        (category) =>
          category.id === activeCategory && category.items.length > 0
      );

  const cartItems = cart
    .map((line) => {
      const item = restaurant.items.find((entry) => entry.id === line.itemId);
      return item ? { ...line, item } : null;
    })
    .filter(
      (
        entry
      ): entry is {
        itemId: string;
        quantity: number;
        item: RestaurantRecord["items"][number];
      } => Boolean(entry)
    );

  const total = cartItems.reduce(
    (sum, line) => sum + line.item.price * line.quantity,
    0
  );
  const totalUnits = cartItems.reduce((sum, line) => sum + line.quantity, 0);
  const heroGradientIntensity = extractGradientIntensity(
    restaurant.theme.heroGradient
  );
  const featuredItems = restaurant.items.filter((item) => item.featured);
  const heroItem = featuredItems[0] ?? restaurant.items[0];
  const heroVisualImage = restaurant.coverImageUrl || heroItem?.image || "";
  const restaurantLogo = restaurant.logoUrl || "";
  const restaurantLogoSize = normalizeLogoSize(restaurant.logoSize);
  const restaurantLogoPosition = normalizeLogoPosition(
    restaurant.logoPosition
  );
  const templateId = restaurant.menuTemplate ?? "classic-delivery";
  const serviceModeLabel =
    restaurant.serviceMode === "table_service"
      ? "Pedido por ubicacion del local"
      : restaurant.serviceMode === "both"
        ? "Pedido en local o para retirar"
        : "Pedido para retirar en caja";

  const changeQuantity = (itemId: string, delta: number) => {
    setCart((current) => {
      const found = current.find((line) => line.itemId === itemId);

      if (!found && delta > 0) {
        const item = restaurant.items.find((entry) => entry.id === itemId);
        posthog.capture("local_qr_product_added", {
          product_id: itemId,
          product_name: item?.name,
          restaurant_slug: restaurant.slug,
        });
        return [...current, { itemId, quantity: 1 }];
      }

      return current
        .map((line) =>
          line.itemId === itemId
            ? { ...line, quantity: line.quantity + delta }
            : line
        )
        .filter((line) => line.quantity > 0);
    });
  };

  const toggleCategoryView = (categoryId: string) => {
    if (activeCategory === categoryId && !showAllCategories) {
      setShowAllCategories(true);
      return;
    }

    setActiveCategory(categoryId);
    setShowAllCategories(false);
  };

  const submitLocalOrder = async () => {
    if (!cartItems.length || !canSubmitOrders || isSubmittingOrder) {
      return;
    }

    if (!isValidCustomerName(customerName)) {
      setCheckoutError("Escribi un nombre valido para identificar el pedido.");
      return;
    }

    if (
      requiresWhatsappForReadyNotice &&
      !isValidWhatsapp(normalizeWhatsapp(customerWhatsapp))
    ) {
      setCheckoutError(
        "Ingresa un WhatsApp valido para recibir el aviso cuando tu pedido este listo."
      );
      return;
    }

    setCheckoutError(null);
    setIsSubmittingOrder(true);

    try {
      const response = await fetch("/api/local-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          customerName: normalizeCustomerName(customerName),
          customerWhatsapp: normalizeWhatsapp(customerWhatsapp),
          customerNote: customerNote.trim(),
          items: cartItems.map((line) => ({
            itemId: line.item.id,
            quantity: line.quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        order?: { id: string };
      };

      if (!response.ok || !data.order?.id) {
        throw new Error(data.error ?? "No se pudo registrar el pedido.");
      }

      posthog.capture("local_order_submitted", {
        restaurant_slug: restaurant.slug,
        total_ars: total,
        item_count: totalUnits,
        service_mode: restaurant.serviceMode ?? "counter_pickup",
      });

      router.push(`/ordenar/${restaurant.slug}/pedido/${data.order.id}`);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "No se pudo registrar el pedido."
      );
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div
      className={styles.shell}
      data-template={templateId}
      style={
        {
          ["--accent" as string]: restaurant.theme.accent,
          ["--accent-soft" as string]: restaurant.theme.accentSoft,
          ["--surface" as string]: restaurant.theme.surface,
          ["--surface-alt" as string]: restaurant.theme.surfaceAlt,
          ["--border" as string]: restaurant.theme.border,
          ["--text" as string]: restaurant.theme.text,
          ["--hero-title" as string]: restaurant.theme.titleColor,
          ["--muted" as string]: restaurant.theme.muted,
          ["--hero-gradient" as string]: restaurant.theme.heroGradient,
          ["--page-background" as string]: buildPageBackground(
            restaurant.theme.surface,
            restaurant.theme.surfaceAlt,
            restaurant.theme.accentSoft
          ),
        } as CSSProperties
      }
    >
      <header className={styles.hero}>
        {heroVisualImage ? (
          <img
            className={styles.heroCoverImage}
            src={heroVisualImage}
            alt=""
            aria-hidden="true"
            style={{ opacity: getHeroImageOpacity(heroGradientIntensity) }}
          />
        ) : null}

        <div className={styles.heroOverlay} />

        {restaurantLogo ? (
          <img
            className={`${styles.restaurantLogoFixed} ${styles[logoSizeClassNames[restaurantLogoSize]]} ${styles[logoPositionClassNames[restaurantLogoPosition]]}`}
            src={restaurantLogo}
            alt={`Logo de ${restaurant.name}`}
          />
        ) : null}

        <div className={styles.heroContent}>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.description}</p>
        </div>
      </header>

      <nav className={styles.categoryRail}>
        {groupedCategories.map((category) => (
          <button
            className={
              activeCategory === category.id && !showAllCategories
                ? styles.categoryActive
                : ""
            }
            key={category.id}
            onClick={() => toggleCategoryView(category.id)}
            type="button"
          >
            <span>{category.name}</span>
            <small>{category.items.length}</small>
          </button>
        ))}
      </nav>

      <section className={styles.hoursCard}>
        <div>
          <strong>Pedidos en local</strong>
          <span className={styles.liveStatus}>{serviceModeLabel}</span>
          <p>
            Esta es la version funcional para consumir en el restaurante y
            registrarse antes de pagar.
          </p>
        </div>
      </section>

      {!localOrdersEnabled ? (
        <section className={styles.closedNotice}>
          <strong>Pedidos en local todavia no habilitados</strong>
          <p>El restaurante todavia no activo esta modalidad en su panel.</p>
        </section>
      ) : null}

      {localOrdersEnabled && !openingStatus.isOpen ? (
        <section className={styles.closedNotice}>
          <strong>Cerrado por horario</strong>
          <p>{openingStatus.detail}</p>
        </section>
      ) : null}

      <section className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <input
            aria-label="Buscar productos"
            placeholder="Buscar por nombre o descripcion"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={styles.toolbarRow}>
          <select
            aria-label="Ordenar productos"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="featured">Destacados</option>
            <option value="price_asc">Precio menor</option>
            <option value="price_desc">Precio mayor</option>
          </select>
          <label className={styles.checkboxPill}>
            <input
              checked={showAllCategories}
              type="checkbox"
              onChange={(event) => setShowAllCategories(event.target.checked)}
            />
            <span>Todas las categorias</span>
          </label>
        </div>
      </section>

      <main className={styles.content}>
        {visibleCategories.length ? (
          visibleCategories.map((category) => (
            <section className={styles.categorySection} key={category.id}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>Categoria</span>
                  <h2>{category.name}</h2>
                </div>
                <span className={styles.sectionHint}>{category.description}</span>
              </div>

              <div className={styles.grid}>
                {category.items.map((item) => {
                  const quantity =
                    cart.find((line) => line.itemId === item.id)?.quantity ?? 0;

                  return (
                    <article className={styles.card} key={item.id}>
                      <div
                        className={styles.cardImage}
                        style={{
                          backgroundImage: item.image
                            ? `url(${item.image})`
                            : undefined,
                        }}
                      />
                      <div className={styles.cardBody}>
                        <div className={styles.cardMeta}>
                          <span>{item.prepTime}</span>
                          <span>{item.available ? "Disponible" : "Agotado"}</span>
                        </div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className={styles.cardFooter}>
                          <strong>{money.format(item.price)}</strong>
                          {quantity ? (
                            <div className={styles.quantityBox}>
                              <button
                                onClick={() => changeQuantity(item.id, -1)}
                                type="button"
                              >
                                -
                              </button>
                              <span>{quantity}</span>
                              <button
                                disabled={!item.available}
                                onClick={() => changeQuantity(item.id, 1)}
                                type="button"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              className={styles.addButton}
                              disabled={!item.available}
                              onClick={() => changeQuantity(item.id, 1)}
                              type="button"
                            >
                              Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <section className={styles.emptyBlock}>
            <h2>Sin resultados</h2>
            <p>No hay productos para esos filtros en este momento.</p>
          </section>
        )}
      </main>

      <footer className={styles.miniFooter}>
        <a
          className={styles.miniFooterLink}
          href="https://menui.online"
          rel="noreferrer"
          target="_blank"
          aria-label="Realizado por Menui"
        >
          <span>realizado por</span>
          <img
            className={styles.miniFooterLogo}
            src="/logos/menui-logo.svg"
            alt="Menui"
          />
        </a>
      </footer>

      <button
        className={styles.fab}
        onClick={() => setIsDrawerOpen(true)}
        type="button"
      >
        <span className={styles.fabIcon}>Pedido</span>
        <span className={styles.fabBadge}>{totalUnits}</span>
      </button>

      <div className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ""}`}>
        <button
          className={styles.backdrop}
          onClick={() => setIsDrawerOpen(false)}
          type="button"
        />
        <aside className={styles.drawerPanel}>
          <header className={styles.drawerHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Pedido en local</span>
              <h2>{restaurant.name}</h2>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setIsDrawerOpen(false)}
              type="button"
            >
              Cerrar
            </button>
          </header>

          <div className={styles.drawerScroll}>
            <div className={styles.cartList}>
              {cartItems.length ? (
                cartItems.map((line) => (
                  <div className={styles.cartRow} key={line.itemId}>
                    <div>
                      <strong>{line.item.name}</strong>
                      <span>{money.format(line.item.price)} por unidad</span>
                    </div>
                    <div className={styles.cartControls}>
                      <div className={styles.quantityBox}>
                        <button
                          onClick={() => changeQuantity(line.itemId, -1)}
                          type="button"
                        >
                          -
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          onClick={() => changeQuantity(line.itemId, 1)}
                          type="button"
                        >
                          +
                        </button>
                      </div>
                      <strong>
                        {money.format(line.item.price * line.quantity)}
                      </strong>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>
                  Agrega productos para registrar el pedido en caja.
                </p>
              )}
            </div>

            <div className={styles.checkoutForm}>
              <label>
                <span>A nombre de quien hacemos el pedido</span>
                <input
                  placeholder="Tu nombre"
                  type="text"
                  value={customerName}
                  onChange={(event) => {
                    setCustomerName(event.target.value);
                    if (checkoutError) setCheckoutError(null);
                  }}
                />
              </label>

              <label>
                <span>
                  WhatsApp
                  {requiresWhatsappForReadyNotice
                    ? " para avisarte cuando este listo"
                    : " (opcional)"}
                </span>
                <input
                  placeholder="5493511234567"
                  type="tel"
                  value={customerWhatsapp}
                  onChange={(event) => {
                    setCustomerWhatsapp(event.target.value);
                    if (checkoutError) setCheckoutError(null);
                  }}
                />
              </label>

              <label>
                <span>Notas para el local</span>
                <textarea
                  placeholder="Ejemplo: sin cebolla, poca sal, etc."
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                />
              </label>

              {checkoutError ? (
                <p className={styles.checkoutError}>{checkoutError}</p>
              ) : null}
            </div>
          </div>

          <footer className={styles.drawerFooter}>
            <div className={styles.cartSummary}>
              <span>Total estimado</span>
              <strong>{money.format(total)}</strong>
            </div>
            <button
              aria-disabled={!canSubmitOrders || !cartItems.length || isSubmittingOrder}
              className={
                !canSubmitOrders || !cartItems.length || isSubmittingOrder
                  ? styles.ctaDisabled
                  : styles.cta
              }
              disabled={!canSubmitOrders || !cartItems.length || isSubmittingOrder}
              onClick={submitLocalOrder}
              type="button"
            >
              {isSubmittingOrder ? "Registrando..." : "Registrar pedido"}
            </button>
            <button
              className={styles.clearButton}
              onClick={() => setCart([])}
              type="button"
            >
              Vaciar pedido
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}
