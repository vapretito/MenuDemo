"use client";

import { CSSProperties, useMemo, useState } from "react";
import styles from "./mobile-menu.module.css";
import { CartLine, RestaurantRecord } from "@/types/platform";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type MobileMenuProps = {
  restaurant: RestaurantRecord;
};

type SortMode = "featured" | "price_asc" | "price_desc";
type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";

const paymentLabels: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta al recibir",
};

const buildWhatsappUrl = (
  restaurant: RestaurantRecord,
  cart: CartLine[],
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

  const message = [
    `Hola ${restaurant.name}, quiero hacer este pedido:`,
    "",
    lines,
    "",
    `Total estimado: ${money.format(total)}`,
    `Direccion de entrega: ${deliveryAddress.trim() || "A confirmar"}`,
    `Forma de pago: ${paymentLabels[paymentMethod]}`,
    customerNote.trim() ? `Notas: ${customerNote.trim()}` : null,
    `Menu: ${restaurant.subdomain}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${restaurant.customerWhatsapp}?text=${encodeURIComponent(message)}`;
};

export function MobileMenu({ restaurant }: MobileMenuProps) {
  const [activeCategory, setActiveCategory] = useState(restaurant.categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [customerNote, setCustomerNote] = useState("");

  const featuredItems = restaurant.items.filter((item) => item.featured);
  const heroItem = featuredItems[0] ?? restaurant.items[0];

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
  const whatsappUrl = buildWhatsappUrl(
    restaurant,
    cart,
    deliveryAddress,
    paymentMethod,
    customerNote
  );

  const changeQuantity = (itemId: string, delta: number) => {
    setCart((current) => {
      const found = current.find((line) => line.itemId === itemId);

      if (!found && delta > 0) {
        return [...current, { itemId, quantity: 1 }];
      }

      return current
        .map((line) =>
          line.itemId === itemId ? { ...line, quantity: line.quantity + delta } : line
        )
        .filter((line) => line.quantity > 0);
    });
  };

  return (
    <div
      className={styles.shell}
      style={
        {
          ["--accent" as string]: restaurant.theme.accent,
          ["--accent-soft" as string]: restaurant.theme.accentSoft,
          ["--surface" as string]: restaurant.theme.surface,
          ["--surface-alt" as string]: restaurant.theme.surfaceAlt,
          ["--border" as string]: restaurant.theme.border,
          ["--text" as string]: restaurant.theme.text,
          ["--muted" as string]: restaurant.theme.muted,
          ["--hero-gradient" as string]: restaurant.theme.heroGradient,
          ["--hero-image" as string]: `url(${heroItem?.image ?? ""})`,
        } as CSSProperties
      }
    >
      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroTop}>
            <span className={styles.badge}>Menu delivery</span>
            <span className={styles.badgeMuted}>{restaurant.subdomain}</span>
          </div>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.description}</p>
          <div className={styles.heroActions}>
            <button className={styles.ctaPrimary} onClick={() => setShowAllCategories(true)} type="button">
              Ver menu
            </button>
            <a
              className={styles.ctaGhost}
              href={`https://wa.me/${restaurant.customerWhatsapp}`}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <nav className={styles.categoryRail}>
        {groupedCategories.map((category) => (
          <button
            className={activeCategory === category.id && !showAllCategories ? styles.categoryActive : ""}
            key={category.id}
            onClick={() => {
              setActiveCategory(category.id);
              setShowAllCategories(false);
            }}
            type="button"
          >
            <span>{category.name}</span>
            <small>{category.items.length}</small>
          </button>
        ))}
      </nav>

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
                    <article className={styles.card} key={item.id}>
                      <div
                        className={styles.cardImage}
                        style={{ backgroundImage: `url(${item.image})` }}
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

      <button className={styles.fab} onClick={() => setIsDrawerOpen(true)} type="button">
        <span className={styles.fabIcon}>Carrito</span>
        <span className={styles.fabBadge}>{totalUnits}</span>
      </button>

      <div className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ""}`}>
        <button className={styles.backdrop} onClick={() => setIsDrawerOpen(false)} type="button" />
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
            </div>
          </div>

          <footer className={styles.drawerFooter}>
            <div className={styles.cartSummary}>
              <span>Total estimado</span>
              <strong>{money.format(total)}</strong>
            </div>
            <a
              aria-disabled={!cartItems.length}
              className={!cartItems.length ? styles.ctaDisabled : styles.cta}
              href={cartItems.length ? whatsappUrl : "#"}
              rel="noreferrer"
              target="_blank"
            >
              Enviar pedido por WhatsApp
            </a>
            <button className={styles.clearButton} onClick={() => setCart([])} type="button">
              Vaciar carrito
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}
