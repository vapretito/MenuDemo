"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import styles from "./mobile-menu.module.css";
import { CartLine, RestaurantRecord } from "@/types/platform";
import { getRestaurantOpeningStatus } from "@/lib/opening-hours";
import {
  buildOrderConfirmationStorageKey,
  type ConfirmOrderPayload,
} from "@/lib/order-confirmation";
const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type MobileMenuProps = {
  restaurant: RestaurantRecord;
  mode?: "interactive" | "visual";
};

type SortMode = "featured" | "price_asc" | "price_desc";
type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";

const paymentLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta al recibir",
};

const buildPageBackground = (
  surface: string,
  surfaceAlt: string,
  accentSoft: string
) =>
  `radial-gradient(circle at top, ${accentSoft}22, transparent 24%), linear-gradient(180deg, ${surface} 0%, ${surfaceAlt} 100%)`;

const buildWhatsappUrl = (
  restaurant: RestaurantRecord,
  cart: CartLine[],
  customerName: string,
  customerWhatsapp: string,
  deliveryAddress: string,
  paymentMethod: PaymentMethod,
  customerNote: string
) => {
  const lines = cart
    .map((line) => {
      const item = restaurant.items.find((entry) => entry.id === line.itemId);
      if (!item) return null;

      return `- ${line.quantity}x ${item.name} - ${money.format(item.price * line.quantity)}`;
    })
    .filter(Boolean)
    .join("\n");

  const total = cart.reduce((sum, line) => {
    const item = restaurant.items.find((entry) => entry.id === line.itemId);
    return sum + (item ? item.price * line.quantity : 0);
  }, 0);

  const introMessage =
  restaurant.whatsappIntroMessage?.trim() ||
  `Hola ${restaurant.name}, quiero hacer este pedido:`;

const footerMessage = restaurant.whatsappFooterMessage?.trim();

const message = [
  introMessage,
  "",
  `Nombre: ${customerName.trim()}`,
  `WhatsApp: ${customerWhatsapp.trim()}`,
  "",
  lines,
  "",
  `Total estimado: ${money.format(total)}`,
  `Direccion de entrega: ${deliveryAddress.trim() || "A confirmar"}`,
  `Forma de pago: ${paymentLabels[paymentMethod]}`,
  customerNote.trim() ? `Notas: ${customerNote.trim()}` : null,
  footerMessage ? "" : null,
  footerMessage || null,
  "",
  `Menu: ${restaurant.subdomain}`,
]
  .filter(Boolean)
  .join("\n");

  return `https://wa.me/${restaurant.customerWhatsapp}?text=${encodeURIComponent(message)}`;
};

export function MobileMenu({
  restaurant,
  mode = "interactive",
}: MobileMenuProps) {
  const router = useRouter();
  const isVisualOnly = mode === "visual";
  const [activeCategory, setActiveCategory] = useState(restaurant.categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [customerNote, setCustomerNote] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<
  RestaurantRecord["items"][number] | null
>(null);




const manualOrdersEnabled = restaurant.isAcceptingOrders ?? true;

const openingStatus = getRestaurantOpeningStatus({
  openingHours: restaurant.openingHours,
  timeZone: restaurant.timeZone,
});

const canSendOrders = !isVisualOnly && manualOrdersEnabled && openingStatus.isOpen;

const closedMessage =
  restaurant.closedMessage ??
  "Estamos cerrados por ahora. Podés revisar el menú y consultarnos por WhatsApp.";

const openingHours = Array.isArray(restaurant.openingHours)
  ? restaurant.openingHours
  : [];

const openingHoursNote = restaurant.openingHoursNote ?? "";
const showOpeningHours = restaurant.showOpeningHours ?? true;


  const featuredItems = restaurant.items.filter((item) => item.featured);
  const heroItem = featuredItems[0] ?? restaurant.items[0];

  const heroVisualImage = restaurant.coverImageUrl || heroItem?.image || "";
  const restaurantLogo = restaurant.logoUrl || "";

  const templateId = restaurant.menuTemplate ?? "classic-delivery";


  const [isRestaurantInfoOpen, setIsRestaurantInfoOpen] = useState(false);

  
  const groupedCategories = useMemo(
    () =>
      restaurant.categories.map((category) => {
        const baseItems = restaurant.items.filter((item) => item.categoryId === category.id);
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
        (category) => category.id === activeCategory && category.items.length > 0
      );

  const cartItems = cart
    .map((line) => {
      const item = restaurant.items.find((entry) => entry.id === line.itemId);
      return item ? { ...line, item } : null;
    })
    .filter(
      (entry): entry is { itemId: string; quantity: number; item: RestaurantRecord["items"][number] } =>
        Boolean(entry)
    );

  const total = cartItems.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const totalUnits = cartItems.reduce((sum, line) => sum + line.quantity, 0);

  const selectedProductQuantity = selectedProduct
  ? cart.find((line) => line.itemId === selectedProduct.id)?.quantity ?? 0
  : 0;

const closeProductModal = () => {
  setSelectedProduct(null);
};

const openProductModal = (item: RestaurantRecord["items"][number]) => {
  posthog.capture("product_detail_viewed", {
    product_id: item.id,
    product_name: item.name,
    product_price_ars: item.price,
    restaurant_slug: restaurant.slug,
  });
  setSelectedProduct(item);
};

  const whatsappUrl = buildWhatsappUrl(
    restaurant,
    cart,
    customerName,
    customerWhatsapp,
    deliveryAddress,
    paymentMethod,
    customerNote
  );

  const normalizedCustomerWhatsapp = customerWhatsapp.replace(/\D/g, "");
  const hasValidCustomerWhatsapp =
    normalizedCustomerWhatsapp.length >= 10 &&
    normalizedCustomerWhatsapp.length <= 15;
  const canSubmitCheckout =
    Boolean(customerName.trim()) &&
    hasValidCustomerWhatsapp &&
    cartItems.length > 0 &&
    canSendOrders;


  const trackCartEvent = async () => {
    if (!cartItems.length) return;
  
    try {
      await fetch("/api/menu/cart-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          customerName,
          customerWhatsapp,
          marketingConsent,
          source: "menu",
          paymentMethod,
          deliveryAddress,
          customerNote,
          items: cartItems.map((line) => ({
            itemId: line.item.id,
            quantity: line.quantity,
          })),
        }),
      });
    } catch (error) {
      console.error("[Track Cart Event Error]", error);
    }
  };

  const changeQuantity = (itemId: string, delta: number) => {
    setCart((current) => {
      const found = current.find((line) => line.itemId === itemId);

      if (!found && delta > 0) {
        const item = restaurant.items.find((entry) => entry.id === itemId);
        posthog.capture("product_added_to_cart", {
          product_id: itemId,
          product_name: item?.name,
          product_price_ars: item?.price,
          restaurant_slug: restaurant.slug,
        });
        return [...current, { itemId, quantity: 1 }];
      }

      return current
        .map((line) =>
          line.itemId === itemId ? { ...line, quantity: line.quantity + delta } : line
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

  const handleSendOrderClick = () => {
    if (!cartItems.length || !canSendOrders) {
      return;
    }

    if (!customerName.trim()) {
      setCheckoutError("Escribí tu nombre para que el local pueda identificarte.");
      return;
    }

    if (!hasValidCustomerWhatsapp) {
      setCheckoutError("Ingresá un WhatsApp válido para continuar con el pedido.");
      return;
    }

    setCheckoutError(null);
    posthog.capture("order_submitted", {
      restaurant_slug: restaurant.slug,
      total_ars: total,
      item_count: totalUnits,
      payment_method: paymentMethod,
      has_delivery_address: Boolean(deliveryAddress.trim()),
      marketing_consent: marketingConsent,
    });
    void trackCartEvent();

    const confirmationPayload: ConfirmOrderPayload = {
      restaurantName: restaurant.name,
      restaurantSlug: restaurant.slug,
      restaurantWhatsapp: restaurant.customerWhatsapp,
      customerName: customerName.trim(),
      customerWhatsapp: customerWhatsapp.trim(),
      deliveryAddress: deliveryAddress.trim(),
      paymentMethodLabel: paymentLabels[paymentMethod],
      customerNote: customerNote.trim(),
      totalArs: total,
      whatsappUrl,
      items: cartItems.map((line) => ({
        id: line.item.id,
        name: line.item.name,
        price: line.item.price,
        quantity: line.quantity,
      })),
    };

    sessionStorage.setItem(
      buildOrderConfirmationStorageKey(restaurant.slug),
      JSON.stringify(confirmationPayload)
    );

    router.push(`/menu/${restaurant.slug}/pedido-realizado`);
  };


  const normalizeInstagramUrl = (value?: string | null) => {
    const cleanValue = value?.trim();
  
    if (!cleanValue) return null;
  
    if (cleanValue.startsWith("http://") || cleanValue.startsWith("https://")) {
      return cleanValue;
    }
  
    const username = cleanValue.replace("@", "");
  
    return `https://instagram.com/${username}`;
  };
  
  const instagramUrl = normalizeInstagramUrl(restaurant.instagramUrl);
  
  const hasRestaurantInfo =
    restaurant.address ||
    restaurant.googleMapsUrl ||
    instagramUrl ||
    restaurant.deliveryZones ||
    restaurant.deliveryTimeEstimate;

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
    />
  ) : null}

  <div className={styles.heroOverlay} />

  {restaurantLogo ? (
    <img
      className={styles.restaurantLogoFixed}
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
            className={activeCategory === category.id && !showAllCategories ? styles.categoryActive : ""}
            key={category.id}
            onClick={() => toggleCategoryView(category.id)}
            type="button"
          >
            <span>{category.name}</span>
            <small>{category.items.length}</small>
          </button>
        ))}
      </nav>

      {!manualOrdersEnabled ? (
  <section className={styles.closedNotice}>
    <strong>Pedidos pausados temporalmente</strong>
    <p>{closedMessage}</p>
  </section>
) : null}

{manualOrdersEnabled && !openingStatus.isOpen ? (
  <section className={styles.closedNotice}>
    <strong>Cerrado por horario</strong>
    <p>{openingStatus.detail}</p>
  </section>
) : null}


{showOpeningHours && openingHours.length ? (
    <section className={styles.hoursCard}>
    <div>
    <strong>Horarios de atención</strong>
<span className={styles.liveStatus}>
  {openingStatus.label}
</span>
      {openingHoursNote ? <p>{openingHoursNote}</p> : null}
    </div>

    <div className={styles.hoursList}>
      {openingHours.map((hour) => (
        <div className={styles.hoursRow} key={hour.day}>
          <span>{hour.label}</span>
          <strong>
            {hour.enabled ? `${hour.openTime} - ${hour.closeTime}` : "Cerrado"}
          </strong>
        </div>
      ))}
    </div>
  </section>
) : null}

{hasRestaurantInfo ? (
  <>
    <button
      className={styles.restaurantInfoFab}
      onClick={() => setIsRestaurantInfoOpen(true)}
      type="button"
      aria-label="Ver información del local"
    >
      i
    </button>

    {isRestaurantInfoOpen ? (
      <div
        className={styles.restaurantInfoLayer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="restaurant-info-title"
      >
        <button
          className={styles.restaurantInfoBackdrop}
          onClick={() => setIsRestaurantInfoOpen(false)}
          type="button"
          aria-label="Cerrar información del local"
        />

        <section className={styles.restaurantInfoModal}>
          <div className={styles.restaurantInfoModalHeader}>
            <div>
              <span>Ayuda e información</span>
              <h2 id="restaurant-info-title">Información del local</h2>
              <p>Datos útiles para pedir, retirar o contactar al restaurante.</p>
            </div>

            <button
              className={styles.restaurantInfoClose}
              onClick={() => setIsRestaurantInfoOpen(false)}
              type="button"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className={styles.restaurantInfoList}>
            {restaurant.address ? (
              <article>
                <span>Dirección</span>
                <strong>{restaurant.address}</strong>
              </article>
            ) : null}

            {restaurant.deliveryZones ? (
              <article>
                <span>Zonas de delivery</span>
                <strong>{restaurant.deliveryZones}</strong>
              </article>
            ) : null}

            {restaurant.deliveryTimeEstimate ? (
              <article>
                <span>Tiempo estimado</span>
                <strong>{restaurant.deliveryTimeEstimate}</strong>
              </article>
            ) : null}

            <div className={styles.restaurantInfoActions}>
              {restaurant.googleMapsUrl ? (
                <a
                  href={restaurant.googleMapsUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver ubicación
                </a>
              ) : null}

              {instagramUrl ? (
                <a href={instagramUrl} rel="noreferrer" target="_blank">
                  Instagram
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    ) : null}
  </>
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
                  const quantity = cart.find((line) => line.itemId === item.id)?.quantity ?? 0;

                  return (
                    <article
  className={styles.card}
  key={item.id}
  role="button"
  tabIndex={0}
  onClick={() => openProductModal(item)}
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProductModal(item);
    }
  }}
>
  <div
    className={styles.cardImage}
    style={{ backgroundImage: item.image ? `url(${item.image})` : undefined }}
  >
    <span className={styles.cardImageHint}>Ver detalle</span>
  </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardMeta}>
                          <span>{item.prepTime}</span>
                          <span>{item.available ? "Disponible" : "Agotado"}</span>
                        </div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div
  className={styles.cardFooter}
  onClick={(event) => event.stopPropagation()}
>
                          <strong>{money.format(item.price)}</strong>
                          {isVisualOnly ? null : quantity ? (
                            <div className={styles.quantityBox}>
                              <button onClick={() => changeQuantity(item.id, -1)} type="button">
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


      {selectedProduct ? (
  <div
    className={styles.productModalLayer}
    role="dialog"
    aria-modal="true"
    aria-labelledby="product-modal-title"
  >
    <button
      className={styles.productModalBackdrop}
      onClick={closeProductModal}
      type="button"
      aria-label="Cerrar detalle del producto"
    />

    <article className={styles.productModal}>
      <button
        className={styles.productModalClose}
        onClick={closeProductModal}
        type="button"
      >
        Cerrar
      </button>

      <div className={styles.productModalImageWrap}>
        {selectedProduct.image ? (
          <img
            src={selectedProduct.image}
            alt={selectedProduct.name}
            className={styles.productModalImage}
          />
        ) : (
          <div className={styles.productModalEmptyImage}>
            Sin imagen cargada
          </div>
        )}
      </div>

      <div className={styles.productModalBody}>
        <div className={styles.productModalMeta}>
          <span>{selectedProduct.prepTime}</span>
          <span>{selectedProduct.available ? "Disponible" : "Agotado"}</span>
        </div>

        <h2 id="product-modal-title">{selectedProduct.name}</h2>

        <p>{selectedProduct.description}</p>

        <div className={styles.productModalFooter}>
          <strong>{money.format(selectedProduct.price)}</strong>

          {isVisualOnly ? null : selectedProductQuantity ? (
            <div className={styles.quantityBox}>
              <button
                onClick={() => changeQuantity(selectedProduct.id, -1)}
                type="button"
              >
                -
              </button>
              <span>{selectedProductQuantity}</span>
              <button
                disabled={!selectedProduct.available}
                onClick={() => changeQuantity(selectedProduct.id, 1)}
                type="button"
              >
                +
              </button>
            </div>
          ) : (
            <button
              className={styles.addButton}
              disabled={!selectedProduct.available}
              onClick={() => changeQuantity(selectedProduct.id, 1)}
              type="button"
            >
              Agregar al carrito
            </button>
          )}
        </div>
      </div>
    </article>
  </div>
) : null}

      {isVisualOnly ? null : (
        <>
          <button
            className={styles.fab}
            onClick={() => {
              posthog.capture("cart_opened", {
                restaurant_slug: restaurant.slug,
                item_count: totalUnits,
                total_ars: total,
              });
              setIsDrawerOpen(true);
            }}
            type="button"
          >
            <span className={styles.fabIcon}>Carrito</span>
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
              <span className={styles.sectionEyebrow}>Tu pedido</span>
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
                        <button onClick={() => changeQuantity(line.itemId, -1)} type="button">
                          -
                        </button>
                        <span>{line.quantity}</span>
                        <button onClick={() => changeQuantity(line.itemId, 1)} type="button">
                          +
                        </button>
                      </div>
                      <strong>{money.format(line.item.price * line.quantity)}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>
                  Agrega productos para generar un pedido listo para WhatsApp.
                </p>
              )}
            </div>

            <div className={styles.checkoutForm}>
              <label>
                <span>Nombre</span>
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
                <span>WhatsApp</span>
                <input
                  placeholder="351 123 4567"
                  type="tel"
                  value={customerWhatsapp}
                  onChange={(event) => {
                    setCustomerWhatsapp(event.target.value);
                    if (checkoutError) setCheckoutError(null);
                  }}
                />
              </label>
              <label>
                <span>Direccion de entrega</span>
                <textarea
                  placeholder="Calle, numero, piso, departamento y referencias"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                />
              </label>
              <label>
                <span>Forma de pago</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta al recibir</option>
                </select>
              </label>
              <label>
                <span>Notas para el local</span>
                <textarea
                  placeholder="Ejemplo: tocar timbre, sin cebolla, etc."
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                />
              </label>
              <label className={styles.checkoutConsent}>
                <input
                  checked={marketingConsent}
                  type="checkbox"
                  onChange={(event) => setMarketingConsent(event.target.checked)}
                />
                <span>Quiero recibir promociones y novedades del local por WhatsApp.</span>
              </label>
              {checkoutError ? <p className={styles.checkoutError}>{checkoutError}</p> : null}
            </div>
          </div>

              <footer className={styles.drawerFooter}>
                <div className={styles.cartSummary}>
                  <span>Total estimado</span>
                  <strong>{money.format(total)}</strong>
                </div>
                <button
                  aria-disabled={!canSubmitCheckout}
                  className={!canSubmitCheckout ? styles.ctaDisabled : styles.cta}
                  disabled={!canSubmitCheckout}
                  onClick={handleSendOrderClick}
                  type="button"
                >
                  Enviar pedido por WhatsApp
                </button>
                <button className={styles.clearButton} onClick={() => setCart([])} type="button">
                  Vaciar carrito
                </button>
              </footer>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
