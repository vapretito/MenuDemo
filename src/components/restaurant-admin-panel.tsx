"use client";

import { ChangeEvent, KeyboardEvent, useMemo, useState } from "react";
import styles from "./restaurant-admin-panel.module.css";
import { demoRestaurant } from "@/data/platform";
import { MenuCategory, MenuItem, RestaurantRecord } from "@/types/platform";
import { menuTemplates } from "@/data/menu-templates";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type AdminSection = "overview" | "identity" | "categories" | "products" | "publishing" |"appearance";

const sections: Array<{ id: AdminSection; label: string; hint: string }> = [
  { id: "overview", label: "Dashboard", hint: "Resumen operativo" },
  { id: "identity", label: "Mi restaurante", hint: "Marca y datos" },
  { id: "categories", label: "Categorías", hint: "Estructura del menú" },
  { id: "products", label: "Productos", hint: "Precios, fotos y estado" },
  { id: "publishing", label: "Publicación", hint: "Subdominio y WhatsApp" },
  { id: "appearance", label: "Estética", hint: "Diseño del menú" },
];
const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createCategory = (name: string): MenuCategory => ({
  id: `${slugify(name)}-${Date.now()}`,
  name,
  description: "Nueva categoria lista para ordenar productos.",
});

const createItem = (categoryId: string): MenuItem => ({
  id: `item-${Date.now()}`,
  categoryId,
  name: "Nuevo producto",
  description: "Descripcion breve del producto para el menu.",
  price: 0,
  image: "",
  featured: false,
  available: true,
  prepTime: "15 min",
});

type RestaurantAdminPanelProps = {
  restaurantSlug?: string;
  initialRestaurant?: RestaurantRecord;
};

export function RestaurantAdminPanel({
  restaurantSlug,
  initialRestaurant,
}: RestaurantAdminPanelProps) {
  const [restaurant, setRestaurant] = useState<RestaurantRecord>(
    initialRestaurant ?? demoRestaurant
  );

  const [appearanceDraft, setAppearanceDraft] = useState({
    menuTemplate: restaurant.menuTemplate ?? "classic-delivery",
    logoUrl: restaurant.logoUrl ?? "",
    coverImageUrl: restaurant.coverImageUrl ?? "",
    accent: restaurant.theme.accent,
    accentSoft: restaurant.theme.accentSoft,
    surface: restaurant.theme.surface,
    surfaceAlt: restaurant.theme.surfaceAlt,
    border: restaurant.theme.border,
    text: restaurant.theme.text,
    muted: restaurant.theme.muted,
    heroGradient: restaurant.theme.heroGradient,
  });
  
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [appearanceSuccess, setAppearanceSuccess] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [productSavingId, setProductSavingId] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [productSuccess, setProductSuccess] = useState<string | null>(null);

  const updateRestaurant = <K extends keyof RestaurantRecord>(
    field: K,
    value: RestaurantRecord[K]
  ) => {
    setRestaurant((current) => ({ ...current, [field]: value }));
  };

  const updateCategory = (categoryId: string, field: keyof MenuCategory, value: string) => {
    setRestaurant((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, [field]: value } : category
      ),
    }));
  };

  const addCategory = () => {
    const normalized = newCategoryName.trim();
    if (!normalized) return;

    const category = createCategory(normalized);
    setRestaurant((current) => ({
      ...current,
      categories: [...current.categories, category],
    }));
    setNewCategoryName("");
  };

  const deleteCategory = (categoryId: string) => {
    setRestaurant((current) => {
      const categories = current.categories.filter((category) => category.id !== categoryId);
      if (!categories.length) return current;

      return {
        ...current,
        categories,
        items: current.items.filter((item) => item.categoryId !== categoryId),
      };
    });
  };

  const addItem = (categoryId?: string) => {
    const fallbackCategoryId = categoryId ?? restaurant.categories[0]?.id;
    if (!fallbackCategoryId) return;

    setRestaurant((current) => ({
      ...current,
      items: [...current.items, createItem(fallbackCategoryId)],
    }));
  };

  const updateItem = <K extends keyof MenuItem>(itemId: string, field: K, value: MenuItem[K]) => {
    setRestaurant((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }));
  };

  const deleteItem = (itemId: string) => {
    setRestaurant((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  };

  const handleImageUpload = (itemId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        updateItem(itemId, "image", result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCategory();
    }
  };

  const categoriesWithItems = useMemo(
    () =>
      restaurant.categories.map((category) => ({
        ...category,
        items: restaurant.items.filter((item) => item.categoryId === category.id),
      })),
    [restaurant.categories, restaurant.items]
  );

  const publicUrl = `https://${restaurant.subdomain}`;
  const adminWhatsappUrl = `https://wa.me/${restaurant.customerWhatsapp}`;
  const activeMeta = sections.find((section) => section.id === activeSection) ?? sections[0];
  const currentRestaurantSlug = restaurantSlug ?? restaurant.slug;

  const updateAppearanceDraft = (
    field: keyof typeof appearanceDraft,
    value: string
  ) => {
    setAppearanceDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };
  
  const applyTemplate = (templateId: string) => {
    const template = menuTemplates.find((entry) => entry.id === templateId);
  
    if (!template) return;
  
    setAppearanceDraft((current) => ({
      ...current,
      menuTemplate: template.id,
      accent: template.accent,
      accentSoft: template.accentSoft,
      surface: template.surface,
      surfaceAlt: template.surfaceAlt,
      border: template.border,
      text: template.text,
      muted: template.muted,
      heroGradient: template.heroGradient,
    }));
  };
  
  const saveAppearance = async () => {
    setAppearanceSaving(true);
    setAppearanceError(null);
    setAppearanceSuccess(null);
  
    try {
      const response = await fetch("/api/restaurant-admin/appearance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appearanceDraft),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
        restaurant?: {
          menuTemplate?: string;
          logoUrl?: string | null;
          coverImageUrl?: string | null;
          theme?: RestaurantRecord["theme"];
        };
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo guardar la estética.");
      }
  
      setRestaurant((current) => ({
        ...current,
        menuTemplate: data.restaurant?.menuTemplate as RestaurantRecord["menuTemplate"],
        logoUrl: data.restaurant?.logoUrl ?? "",
        coverImageUrl: data.restaurant?.coverImageUrl ?? "",
        theme: data.restaurant?.theme ?? current.theme,
      }));
  
      setAppearanceSuccess("Estética guardada correctamente.");
    } catch (error) {
      setAppearanceError(
        error instanceof Error ? error.message : "No se pudo guardar la estética."
      );
    } finally {
      setAppearanceSaving(false);
    }
  };


  const createProduct = async (categoryId: string) => {
    setProductError(null);
    setProductSuccess(null);
    setProductSavingId("new");
  
    try {
      const response = await fetch("/api/restaurant-admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
        }),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        product?: RestaurantRecord["items"][number];
        error?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.product) {
        throw new Error(data.error ?? "No se pudo crear el producto.");
      }
  
      setRestaurant((current) => ({
        ...current,
        items: [...current.items, data.product as RestaurantRecord["items"][number]],
      }));
  
      setProductSuccess("Producto creado. Ahora podés editarlo y guardar cambios.");
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "No se pudo crear el producto."
      );
    } finally {
      setProductSavingId(null);
    }
  };
  
  const saveProduct = async (productId: string) => {
    const product = restaurant.items.find((item) => item.id === productId);
  
    if (!product) return;
  
    setProductError(null);
    setProductSuccess(null);
    setProductSavingId(productId);
  
    try {
      const response = await fetch(`/api/restaurant-admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        product?: RestaurantRecord["items"][number];
        error?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.product) {
        throw new Error(data.error ?? "No se pudo guardar el producto.");
      }
  
      setRestaurant((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === productId
            ? (data.product as RestaurantRecord["items"][number])
            : item
        ),
      }));
  
      setProductSuccess("Producto guardado correctamente.");
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "No se pudo guardar el producto."
      );
    } finally {
      setProductSavingId(null);
    }
  };
  
  const deleteProduct = async (productId: string) => {
    setProductError(null);
    setProductSuccess(null);
    setProductSavingId(productId);
  
    try {
      const response = await fetch(`/api/restaurant-admin/products/${productId}`, {
        method: "DELETE",
      });
  
      const rawResponse = await response.text();
  
      let data: {
        deleted?: boolean;
        error?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.deleted) {
        throw new Error(data.error ?? "No se pudo borrar el producto.");
      }
  
      setRestaurant((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== productId),
      }));
  
      setProductSuccess("Producto eliminado correctamente.");
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "No se pudo borrar el producto."
      );
    } finally {
      setProductSavingId(null);
    }
  };


  return (
    <div className={styles.shell} data-theme={themeMode}>
     <button
  aria-expanded={isSidebarOpen}
  aria-label={isSidebarOpen ? "Cerrar menú admin" : "Abrir menú admin"}
  className={styles.mobileSidebarButton}
  onClick={() => setIsSidebarOpen((current) => !current)}
  type="button"
>
  <span className={styles.hamburgerIcon} aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
  <span>Menú admin</span>
</button>

      <div
        className={`${styles.sidebarBackdrop} ${isSidebarOpen ? styles.sidebarBackdropOpen : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

<aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
  <button
    aria-expanded={isSidebarOpen}
    aria-label={isSidebarOpen ? "Contraer sidebar" : "Expandir sidebar"}
    className={styles.sidebarToggle}
    onClick={() => setIsSidebarOpen((current) => !current)}
    type="button"
  >
    <span className={styles.hamburgerIcon} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  </button>

  <div className={styles.sidebarBrand}>
          <span className={styles.sidebarKicker}>Restaurant Admin</span>
          <strong>{restaurant.name}</strong>
          <p>{restaurant.city} · {currentRestaurantSlug}</p>
        </div>

        <nav className={styles.sidebarNav}>
          {sections.map((section) => (
            <button
              className={activeSection === section.id ? styles.navItemActive : styles.navItem}
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setIsSidebarOpen(false);
              }}
              type="button"
            >
              <strong>{section.label}</strong>
              <span>{section.hint}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <span>Menu publico</span>
          <strong>{publicUrl}</strong>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.workspaceHeader}>
          <div>
            <span className={styles.eyebrow}>{activeMeta.label}</span>
            <h2>{activeMeta.hint}</h2>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.statusPill}>Borrado de productos activo</span>
            <button
              className={styles.themeToggle}
              onClick={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
              type="button"
            >
              {themeMode === "light" ? "Modo nocturno" : "Modo claro"}
            </button>
          </div>
        </header>

        {activeSection === "overview" ? (
          <div className={styles.stack}>
            <section className={styles.heroSummary}>
              <div>
                <span className={styles.eyebrow}>Resumen del local</span>
                <h3>{restaurant.name}</h3>
                <p>{restaurant.description}</p>
              </div>
              <div className={styles.heroSummaryMeta}>
                <div>
                  <strong>{money.format(restaurant.subscription.amountArs)}</strong>
                  <span>Membresia mensual</span>
                </div>
                <div>
                  <strong>{restaurant.metrics.monthlyOrders}</strong>
                  <span>Pedidos de referencia</span>
                </div>
              </div>
            </section>

            <section className={styles.metricGrid}>
              <article className={styles.metricCard}>
                <strong>{restaurant.items.length}</strong>
                <span>productos cargados</span>
              </article>
              <article className={styles.metricCard}>
                <strong>{restaurant.items.filter((item) => item.available).length}</strong>
                <span>disponibles</span>
              </article>
              <article className={styles.metricCard}>
                <strong>{restaurant.categories.length}</strong>
                <span>categorias</span>
              </article>
              <article className={styles.metricCard}>
                <strong>{restaurant.customerWhatsapp}</strong>
                <span>whatsapp receptor</span>
              </article>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>Checklist de producto</span>
                  <h3>Base lista para operar</h3>
                </div>
              </div>
              <ul className={styles.todoList}>
                <li>El restaurante puede borrar productos individualmente desde la seccion Productos.</li>
                <li>El menu publico ya arma pedido con direccion y forma de pago.</li>
                <li>El admin sigue siendo la pantalla operativa para menu, fotos y disponibilidad.</li>
              </ul>
            </section>
          </div>
        ) : null}

        {activeSection === "identity" ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Identidad</span>
                <h3>Datos comerciales del restaurante</h3>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label>
                <span>Nombre del restaurante</span>
                <input value={restaurant.name} onChange={(event) => updateRestaurant("name", event.target.value)} />
              </label>
              <label>
                <span>Ciudad</span>
                <input value={restaurant.city} onChange={(event) => updateRestaurant("city", event.target.value)} />
              </label>
              <label>
                <span>Tipo de cocina</span>
                <input value={restaurant.cuisine} onChange={(event) => updateRestaurant("cuisine", event.target.value)} />
              </label>
              <label>
                <span>WhatsApp pedidos</span>
                <input value={restaurant.customerWhatsapp} onChange={(event) => updateRestaurant("customerWhatsapp", event.target.value)} />
              </label>
              <label className={styles.full}>
                <span>Descripcion corta del local</span>
                <textarea value={restaurant.description} onChange={(event) => updateRestaurant("description", event.target.value)} />
              </label>
            </div>
          </section>
        ) : null}

        {activeSection === "categories" ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Categorias</span>
                <h3>Arquitectura del menu</h3>
              </div>
              <span className={styles.counterPill}>{restaurant.categories.length} categorias</span>
            </div>

            <div className={styles.inlineCreate}>
              <input
                placeholder="Nueva categoria"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={handleCategoryKeyDown}
              />
              <button className={styles.primaryButton} onClick={addCategory} type="button">
                Agregar categoria
              </button>
            </div>

            <div className={styles.stack}>
              {restaurant.categories.map((category) => (
                <article className={styles.categoryCard} key={category.id}>
                  <div className={styles.formGrid}>
                    <label>
                      <span>Nombre</span>
                      <input value={category.name} onChange={(event) => updateCategory(category.id, "name", event.target.value)} />
                    </label>
                    <label className={styles.full}>
                      <span>Descripcion</span>
                      <textarea value={category.description} onChange={(event) => updateCategory(category.id, "description", event.target.value)} />
                    </label>
                  </div>
                  <div className={styles.rowActions}>
                    <span>{restaurant.items.filter((item) => item.categoryId === category.id).length} productos asignados</span>
                    <button
                      className={styles.ghostDanger}
                      disabled={restaurant.categories.length === 1}
                      onClick={() => deleteCategory(category.id)}
                      type="button"
                    >
                      Eliminar categoria
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === "products" ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Productos</span>
                <h3>Items, fotos, precios y borrado</h3>
              </div>
              <button
  className={styles.primaryButton}
  disabled={productSavingId === "new" || restaurant.categories.length === 0}
  onClick={() => {
    const firstCategory = restaurant.categories[0];

    if (firstCategory) {
      createProduct(firstCategory.id);
    }
  }}
  type="button"
>
  {productSavingId === "new" ? "Creando..." : "Agregar producto"}
</button>

            </div>

            <div className={styles.stack}>
              {categoriesWithItems.map((category) => (
                <section className={styles.productGroup} key={category.id}>
                  <div className={styles.panelHeader}>
                    <div>
                      <span className={styles.eyebrow}>{category.name}</span>
                      <h3>{category.description}</h3>
                    </div>
                    <button
  className={styles.secondaryButton}
  disabled={productSavingId === "new"}
  onClick={() => createProduct(category.id)}
  type="button"
>
  Agregar en categoría
</button>
                  </div>

                  <div className={styles.stack}>
                    {category.items.map((item) => (
                      <article className={styles.productCard} key={item.id}>
                        <div className={styles.productCardHead}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{money.format(item.price)}</span>
                          </div>
                          <div className={styles.productActions}>
  <button
    className={styles.primaryButton}
    disabled={productSavingId === item.id}
    onClick={() => saveProduct(item.id)}
    type="button"
  >
    {productSavingId === item.id ? "Guardando..." : "Guardar producto"}
  </button>

  <button
    className={styles.ghostDanger}
    disabled={productSavingId === item.id}
    onClick={() => deleteProduct(item.id)}
    type="button"
  >
    Eliminar producto
  </button>
</div>
                        </div>

                        <div className={styles.formGrid}>
                          <label>
                            <span>Producto</span>
                            <input value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} />
                          </label>
                          <label>
                            <span>Precio</span>
                            <input type="number" value={item.price} onChange={(event) => updateItem(item.id, "price", Number(event.target.value))} />
                          </label>
                          <label>
                            <span>Categoria</span>
                            <select value={item.categoryId} onChange={(event) => updateItem(item.id, "categoryId", event.target.value)}>
                              {restaurant.categories.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>Tiempo estimado</span>
                            <input value={item.prepTime} onChange={(event) => updateItem(item.id, "prepTime", event.target.value)} />
                          </label>
                          <label className={styles.full}>
                            <span>Descripcion</span>
                            <textarea value={item.description} onChange={(event) => updateItem(item.id, "description", event.target.value)} />
                          </label>
                          <label className={styles.full}>
                            <span>Foto del producto</span>
                            <input accept="image/*" type="file" onChange={(event) => handleImageUpload(item.id, event)} />
                            {item.image ? (
                              <div className={styles.imagePreview} style={{ backgroundImage: `url(${item.image})` }} />
                            ) : null}
                          </label>
                        </div>

                        <div className={styles.toggleRow}>
                          <label className={styles.toggle}>
                            <input checked={item.available} type="checkbox" onChange={(event) => updateItem(item.id, "available", event.target.checked)} />
                            <span>{item.available ? "Disponible" : "No disponible"}</span>
                          </label>
                          <label className={styles.toggle}>
                            <input checked={item.featured} type="checkbox" onChange={(event) => updateItem(item.id, "featured", event.target.checked)} />
                            <span>{item.featured ? "Destacado" : "Normal"}</span>
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ) : null}

{activeSection === "appearance" ? (
  <div className={styles.stack}>
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Personalización</span>
          <h3>Estética del menú</h3>
          <p>
            Elegí una plantilla visual y ajustá colores, logo e imagen principal
            del menú público.
          </p>
        </div>

        <button
          className={styles.primaryButton}
          disabled={appearanceSaving}
          onClick={saveAppearance}
          type="button"
        >
          {appearanceSaving ? "Guardando..." : "Guardar estética"}
        </button>
      </div>

      {appearanceError ? (
        <div className={styles.errorBox}>{appearanceError}</div>
      ) : null}

      {appearanceSuccess ? (
        <div className={styles.successBox}>{appearanceSuccess}</div>
      ) : null}
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Plantillas</span>
          <h3>Elegí un estilo base</h3>
        </div>
      </div>

      <div className={styles.templateGrid}>
        {menuTemplates.map((template) => (
          <button
            key={template.id}
            className={
              appearanceDraft.menuTemplate === template.id
                ? styles.templateCardActive
                : styles.templateCard
            }
            onClick={() => applyTemplate(template.id)}
            type="button"
          >
            <div
              className={styles.templatePreview}
              style={{
                background: template.heroGradient,
                borderColor: template.border,
              }}
            >
              <span
                style={{
                  background: template.accent,
                  color: template.text,
                }}
              />
              <strong style={{ color: "#ffffff" }}>{template.name}</strong>
            </div>

            <div>
              <strong>{template.name}</strong>
              <p>{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Marca</span>
          <h3>Logo e imagen principal</h3>
        </div>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.full}>
          <span>Logo URL</span>
          <input
            placeholder="https://..."
            value={appearanceDraft.logoUrl}
            onChange={(event) =>
              updateAppearanceDraft("logoUrl", event.target.value)
            }
          />
        </label>

        <label className={styles.full}>
          <span>Imagen portada URL</span>
          <input
            placeholder="https://..."
            value={appearanceDraft.coverImageUrl}
            onChange={(event) =>
              updateAppearanceDraft("coverImageUrl", event.target.value)
            }
          />
        </label>
      </div>
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Colores</span>
          <h3>Ajustes visuales</h3>
        </div>
      </div>

      <div className={styles.colorGrid}>
        <label>
          <span>Color principal</span>
          <input
            type="color"
            value={appearanceDraft.accent}
            onChange={(event) =>
              updateAppearanceDraft("accent", event.target.value)
            }
          />
          <input
            value={appearanceDraft.accent}
            onChange={(event) =>
              updateAppearanceDraft("accent", event.target.value)
            }
          />
        </label>

        <label>
          <span>Color suave</span>
          <input
            type="color"
            value={appearanceDraft.accentSoft}
            onChange={(event) =>
              updateAppearanceDraft("accentSoft", event.target.value)
            }
          />
          <input
            value={appearanceDraft.accentSoft}
            onChange={(event) =>
              updateAppearanceDraft("accentSoft", event.target.value)
            }
          />
        </label>

        <label>
          <span>Fondo</span>
          <input
            type="color"
            value={appearanceDraft.surface}
            onChange={(event) =>
              updateAppearanceDraft("surface", event.target.value)
            }
          />
          <input
            value={appearanceDraft.surface}
            onChange={(event) =>
              updateAppearanceDraft("surface", event.target.value)
            }
          />
        </label>

        <label>
          <span>Fondo alternativo</span>
          <input
            type="color"
            value={appearanceDraft.surfaceAlt}
            onChange={(event) =>
              updateAppearanceDraft("surfaceAlt", event.target.value)
            }
          />
          <input
            value={appearanceDraft.surfaceAlt}
            onChange={(event) =>
              updateAppearanceDraft("surfaceAlt", event.target.value)
            }
          />
        </label>

        <label>
          <span>Borde</span>
          <input
            type="color"
            value={appearanceDraft.border}
            onChange={(event) =>
              updateAppearanceDraft("border", event.target.value)
            }
          />
          <input
            value={appearanceDraft.border}
            onChange={(event) =>
              updateAppearanceDraft("border", event.target.value)
            }
          />
        </label>

        <label>
          <span>Texto</span>
          <input
            type="color"
            value={appearanceDraft.text}
            onChange={(event) =>
              updateAppearanceDraft("text", event.target.value)
            }
          />
          <input
            value={appearanceDraft.text}
            onChange={(event) =>
              updateAppearanceDraft("text", event.target.value)
            }
          />
        </label>
      </div>
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Vista previa</span>
          <h3>Preview del menú</h3>
        </div>
      </div>

      <div
        className={styles.menuPreview}
        style={{
          background: appearanceDraft.surface,
          color: appearanceDraft.text,
          borderColor: appearanceDraft.border,
        }}
      >
        <div
          className={styles.menuPreviewHero}
          style={{
            background: appearanceDraft.heroGradient,
          }}
        >
          {appearanceDraft.logoUrl ? (
            <img src={appearanceDraft.logoUrl} alt="Logo del restaurante" />
          ) : (
            <div className={styles.previewLogoFallback}>
              {restaurant.name.slice(0, 1)}
            </div>
          )}

          <span>Menu Delivery</span>
          <h4>{restaurant.name}</h4>
          <p>{restaurant.description}</p>

          <button
            type="button"
            style={{
              background: appearanceDraft.accent,
              color: appearanceDraft.text,
              borderColor: appearanceDraft.border,
            }}
          >
            Ver menú
          </button>
        </div>

        <div className={styles.previewProducts}>
          <article style={{ background: appearanceDraft.surfaceAlt }}>
            <strong>Producto destacado</strong>
            <span>$ 9.900</span>
          </article>

          <article style={{ background: appearanceDraft.surfaceAlt }}>
            <strong>Combo especial</strong>
            <span>$ 12.500</span>
          </article>
        </div>
      </div>
    </section>
  </div>
) : null}

        {activeSection === "publishing" ? (
          <div className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>Publicacion</span>
                  <h3>Destino real del producto</h3>
                </div>
              </div>
              <div className={styles.publishGrid}>
                <div className={styles.publishCard}>
                  <span>Subdominio activo</span>
                  <strong>{publicUrl}</strong>
                </div>
                <div className={styles.publishCard}>
                  <span>WhatsApp receptor</span>
                  <strong>{adminWhatsappUrl}</strong>
                </div>
                <div className={styles.publishCard}>
                  <span>Uso principal</span>
                  <strong>Delivery y take away desde menu web</strong>
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>Persistencia futura</span>
                  <h3>Lo que deberia guardarse en base real</h3>
                </div>
              </div>
              <ul className={styles.todoList}>
                <li>Perfil del restaurante con su subdominio y branding.</li>
                <li>WhatsApp oficial que recibe los pedidos del carrito.</li>
                <li>Categorias y productos con precio, estado, foto y orden.</li>
                <li>Relacion entre restaurante, admin y suscripcion en Mercado Pago.</li>
              </ul>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
