"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import styles from "./restaurant-admin-panel.module.css";
import { demoRestaurant } from "@/data/platform";
import { MenuCategory, MenuItem, OpeningHour, RestaurantRecord } from "@/types/platform";
import { menuTemplates } from "@/data/menu-templates";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});




type AdminSection =
  | "overview"
  | "identity"
  | "categories"
  | "products"
  | "publishing"
  | "appearance"
  | "security";


  type PaymentBreakdownItem = {
    label: string;
    totalEvents: number;
    totalItems: number;
    totalArs: number;
  };
  
  type CashClosureRecord = {
    id: string;
    businessDate: string;
    totalEvents: number;
    totalEstimatedArs: number;
    totalItems: number;
    averageTicketArs: number;
    paymentBreakdown: Record<string, PaymentBreakdownItem>;
    notes: string | null;
    createdAt: string;
  };


const sections: Array<{ id: AdminSection; label: string; hint: string }> = [
  { id: "overview", label: "Dashboard", hint: "Resumen operativo" },
  { id: "identity", label: "Mi restaurante", hint: "Marca y datos" },
  { id: "categories", label: "Categorías", hint: "Estructura del menú" },
  { id: "products", label: "Productos", hint: "Precios, fotos y estado" },
  { id: "publishing", label: "Publicación", hint: "Subdominio y WhatsApp" },
  { id: "appearance", label: "Estética", hint: "Diseño del menú" },
  { id: "security", label: "Seguridad", hint: "Cuenta y acceso" },
];


const defaultOpeningHours: OpeningHour[] = [
  { day: "monday", label: "Lunes", enabled: true, openTime: "10:00", closeTime: "23:00" },
  { day: "tuesday", label: "Martes", enabled: true, openTime: "10:00", closeTime: "23:00" },
  { day: "wednesday", label: "Miércoles", enabled: true, openTime: "10:00", closeTime: "23:00" },
  { day: "thursday", label: "Jueves", enabled: true, openTime: "10:00", closeTime: "23:00" },
  { day: "friday", label: "Viernes", enabled: true, openTime: "10:00", closeTime: "23:30" },
  { day: "saturday", label: "Sábado", enabled: true, openTime: "12:00", closeTime: "00:00" },
  { day: "sunday", label: "Domingo", enabled: false, openTime: "12:00", closeTime: "22:00" },
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

  const [cartSummary, setCartSummary] = useState({
    totalEvents: 0,
    totalEstimatedArs: 0,
    totalItems: 0,
    averageTicketArs: 0,
    lastEvents: [] as Array<{
      id: string;
      totalArs: number;
      itemCount: number;
      paymentMethod: string;
      createdAt: string;
    }>,
  });



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

  const [isProductCreateOpen, setIsProductCreateOpen] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

const [productDraft, setProductDraft] = useState({
  categoryId: restaurant.categories[0]?.id ?? "",
  name: "",
  description: "",
  price: 0,
  image: "",
  prepTime: "15 min",
  featured: false,
  available: true,
});


  const [categorySavingId, setCategorySavingId] = useState<string | null>(null);
const [categoryError, setCategoryError] = useState<string | null>(null);
const [categorySuccess, setCategorySuccess] = useState<string | null>(null);

const [profileSaving, setProfileSaving] = useState(false);
const [profileError, setProfileError] = useState<string | null>(null);
const [profileSuccess, setProfileSuccess] = useState<string | null>(null);


const [whatsappDraft, setWhatsappDraft] = useState({
  whatsappIntroMessage:
    restaurant.whatsappIntroMessage ??
    "Hola, quiero hacer este pedido desde el menú online:",
  whatsappFooterMessage:
    restaurant.whatsappFooterMessage ??
    "Por favor confirmar disponibilidad y tiempo estimado.",
});

const [whatsappSaving, setWhatsappSaving] = useState(false);
const [whatsappError, setWhatsappError] = useState<string | null>(null);
const [whatsappSuccess, setWhatsappSuccess] = useState<string | null>(null);


const [orderingDraft, setOrderingDraft] = useState({
  isAcceptingOrders: restaurant.isAcceptingOrders ?? true,
  closedMessage:
    restaurant.closedMessage ??
    "Estamos cerrados por ahora. Podés revisar el menú y consultarnos por WhatsApp.",
});

const [orderingSaving, setOrderingSaving] = useState(false);
const [orderingError, setOrderingError] = useState<string | null>(null);
const [orderingSuccess, setOrderingSuccess] = useState<string | null>(null);



const [hoursDraft, setHoursDraft] = useState({
  showOpeningHours: restaurant.showOpeningHours ?? true,
  timeZone: restaurant.timeZone ?? "America/Argentina/Cordoba",
  openingHours: restaurant.openingHours?.length
    ? restaurant.openingHours
    : defaultOpeningHours,
  openingHoursNote:
    restaurant.openingHoursNote ??
    "Horarios sujetos a disponibilidad del restaurante.",
});

const [hoursSaving, setHoursSaving] = useState(false);
const [hoursError, setHoursError] = useState<string | null>(null);
const [hoursSuccess, setHoursSuccess] = useState<string | null>(null);


const [passwordDraft, setPasswordDraft] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const [passwordSaving, setPasswordSaving] = useState(false);
const [passwordError, setPasswordError] = useState<string | null>(null);
const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);


const [imageUploadingKey, setImageUploadingKey] = useState<string | null>(null);

const [cashSummary, setCashSummary] = useState({
  businessDate: "",
  totalEvents: 0,
  totalEstimatedArs: 0,
  totalItems: 0,
  averageTicketArs: 0,
  paymentBreakdown: {} as Record<string, PaymentBreakdownItem>,
  existingClosure: null as CashClosureRecord | null,
  lastClosures: [] as CashClosureRecord[],
});

const [cashNotes, setCashNotes] = useState("");
const [cashSaving, setCashSaving] = useState(false);
const [cashError, setCashError] = useState<string | null>(null);
const [cashSuccess, setCashSuccess] = useState<string | null>(null);
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

  const saveCategory = async (categoryId: string) => {
    const category = restaurant.categories.find((entry) => entry.id === categoryId);
  
    if (!category) return;
  
    setCategorySavingId(categoryId);
    setCategoryError(null);
    setCategorySuccess(null);
  
    try {
      const response = await fetch(`/api/restaurant-admin/categories/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        category?: MenuCategory;
        error?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.category) {
        throw new Error(data.error ?? "No se pudo guardar la categoría.");
      }
  
      setRestaurant((current) => ({
        ...current,
        categories: current.categories.map((entry) =>
          entry.id === categoryId ? (data.category as MenuCategory) : entry
        ),
      }));
  
      setCategorySuccess("Categoría guardada correctamente.");
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "No se pudo guardar la categoría."
      );
    } finally {
      setCategorySavingId(null);
    }
  };

  const addCategory = async () => {
    const normalized = newCategoryName.trim();
  
    if (!normalized) return;
  
    setCategorySavingId("new");
    setCategoryError(null);
    setCategorySuccess(null);
  
    try {
      const response = await fetch("/api/restaurant-admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalized,
          description: "Nueva categoría lista para ordenar productos.",
        }),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        category?: MenuCategory;
        error?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.category) {
        throw new Error(data.error ?? "No se pudo crear la categoría.");
      }
  
      setRestaurant((current) => ({
        ...current,
        categories: [...current.categories, data.category as MenuCategory],
      }));
  
      setNewCategoryName("");
      setCategorySuccess("Categoría creada correctamente.");
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "No se pudo crear la categoría."
      );
    } finally {
      setCategorySavingId(null);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (restaurant.categories.length <= 1) return;
  
    setCategorySavingId(categoryId);
    setCategoryError(null);
    setCategorySuccess(null);
  
    try {
      const response = await fetch(`/api/restaurant-admin/categories/${categoryId}`, {
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
        throw new Error(data.error ?? "No se pudo eliminar la categoría.");
      }
  
      setRestaurant((current) => ({
        ...current,
        categories: current.categories.filter((category) => category.id !== categoryId),
        items: current.items.filter((item) => item.categoryId !== categoryId),
      }));
  
      setCategorySuccess("Categoría eliminada correctamente.");
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "No se pudo eliminar la categoría."
      );
    } finally {
      setCategorySavingId(null);
    }
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

  const handleImageUpload = async (
    itemId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    setProductError(null);
    setProductSuccess(null);
  
    try {
      const imageUrl = await uploadRestaurantImage(
        file,
        "product",
        `product-${itemId}`
      );
  
      updateItem(itemId, "image", imageUrl);
      setProductSuccess("Imagen subida. Tocá “Guardar producto” para guardar el cambio.");
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "No se pudo subir la imagen."
      );
    } finally {
      event.target.value = "";
    }
  };


  const handleProductDraftImageUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    setProductError(null);
    setProductSuccess(null);
  
    try {
      const imageUrl = await uploadRestaurantImage(
        file,
        "product",
        "product-draft"
      );
  
      setProductDraft((current) => ({
        ...current,
        image: imageUrl,
      }));
  
      setProductSuccess("Imagen subida correctamente.");
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "No se pudo subir la imagen."
      );
    } finally {
      event.target.value = "";
    }
  };


  const handleAppearanceImageUpload = async (
    field: "logoUrl" | "coverImageUrl",
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    setAppearanceError(null);
    setAppearanceSuccess(null);
  
    try {
      const imageUrl = await uploadRestaurantImage(
        file,
        field === "logoUrl" ? "logo" : "cover",
        field
      );
  
      updateAppearanceDraft(field, imageUrl);
      setAppearanceSuccess(
        field === "logoUrl"
          ? "Logo subido. Tocá “Guardar estética” para guardar el cambio."
          : "Portada subida. Tocá “Guardar estética” para guardar el cambio."
      );
    } catch (error) {
      setAppearanceError(
        error instanceof Error ? error.message : "No se pudo subir la imagen."
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleCategoryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void addCategory();
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

  const activeProduct =
    restaurant.items.find((item) => item.id === activeProductId) ?? null;

  const activeProductCategory = activeProduct
    ? restaurant.categories.find((category) => category.id === activeProduct.categoryId) ?? null
    : null;

  const activeProductCategoryItems = activeProductCategory
    ? restaurant.items.filter((item) => item.categoryId === activeProductCategory.id)
    : [];

  const activeProductIndex = activeProduct
    ? activeProductCategoryItems.findIndex((item) => item.id === activeProduct.id)
    : -1;

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


  const createProduct = async (categoryId?: string) => {
  const finalCategoryId = categoryId ?? productDraft.categoryId;

  if (!finalCategoryId) {
    setProductError("Primero creá o seleccioná una categoría.");
    return;
  }

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
        ...productDraft,
        categoryId: finalCategoryId,
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
       items: [
         ...current.items,
         data.product as RestaurantRecord["items"][number],
       ],
     }));

     setActiveProductId(data.product.id);

     setProductDraft({
       categoryId: finalCategoryId,
       name: "",
      description: "",
      price: 0,
      image: "",
      prepTime: "15 min",
      featured: false,
      available: true,
    });

    setIsProductCreateOpen(false);
    setProductSuccess("Producto creado correctamente.");
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

      setActiveProductId((current) => (current === productId ? null : current));

      setProductSuccess("Producto eliminado correctamente.");
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "No se pudo borrar el producto."
      );
    } finally {
      setProductSavingId(null);
    }
  };

  const saveRestaurantProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
  
    try {
      const response = await fetch("/api/restaurant-admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: restaurant.name,
          city: restaurant.city,
          cuisine: restaurant.cuisine,
          customerWhatsapp: restaurant.customerWhatsapp,
          description: restaurant.description,
          address: restaurant.address,
          googleMapsUrl: restaurant.googleMapsUrl,
          instagramUrl: restaurant.instagramUrl,
          deliveryZones: restaurant.deliveryZones,
          deliveryTimeEstimate: restaurant.deliveryTimeEstimate,
        }),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
        restaurant?: {
          name: string;
          city: string;
          cuisine: string;
          customerWhatsapp: string;
          description: string;
          address?: string | null;
          googleMapsUrl?: string | null;
          instagramUrl?: string | null;
          deliveryZones?: string | null;
          deliveryTimeEstimate?: string | null;
        };
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok || !data.restaurant) {
        throw new Error(data.error ?? "No se pudieron guardar los datos.");
      }
  
      setRestaurant((current) => ({
        ...current,
        name: data.restaurant?.name ?? current.name,
        city: data.restaurant?.city ?? current.city,
        cuisine: data.restaurant?.cuisine ?? current.cuisine,
        customerWhatsapp:
          data.restaurant?.customerWhatsapp ?? current.customerWhatsapp,
        description: data.restaurant?.description ?? current.description,
        address: data.restaurant?.address ?? current.address,
        googleMapsUrl: data.restaurant?.googleMapsUrl ?? current.googleMapsUrl,
        instagramUrl: data.restaurant?.instagramUrl ?? current.instagramUrl,
        deliveryZones: data.restaurant?.deliveryZones ?? current.deliveryZones,
        deliveryTimeEstimate:
          data.restaurant?.deliveryTimeEstimate ?? current.deliveryTimeEstimate,
      }));
  
      setProfileSuccess("Datos del restaurante guardados correctamente.");
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los datos del restaurante."
      );
    } finally {
      setProfileSaving(false);
    }
  };



  const saveWhatsappMessage = async () => {
    setWhatsappSaving(true);
    setWhatsappError(null);
    setWhatsappSuccess(null);
  
    try {
      const response = await fetch("/api/restaurant-admin/whatsapp-message", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(whatsappDraft),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
        restaurant?: {
          whatsappIntroMessage: string;
          whatsappFooterMessage: string;
        };
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok || !data.restaurant) {
        throw new Error(data.error ?? "No se pudo guardar el mensaje.");
      }
  
      setRestaurant((current) => ({
        ...current,
        whatsappIntroMessage: data.restaurant?.whatsappIntroMessage,
        whatsappFooterMessage: data.restaurant?.whatsappFooterMessage,
      }));
  
      setWhatsappSuccess("Mensaje de WhatsApp guardado correctamente.");
    } catch (error) {
      setWhatsappError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el mensaje de WhatsApp."
      );
    } finally {
      setWhatsappSaving(false);
    }
  };



  const loadCartSummary = async () => {
    try {
      const response = await fetch("/api/restaurant-admin/cart-events/summary", {
        cache: "no-store",
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        summary?: typeof cartSummary;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        return;
      }
  
      if (response.ok && data.ok && data.summary) {
        setCartSummary(data.summary);
      }
    } catch (error) {
      console.error("[Load Cart Summary Error]", error);
    }
  };
  
  useEffect(() => {
    void loadCartSummary();
    void loadCashSummary();
  }, []);

  const saveOrderingStatus = async () => {
    setOrderingSaving(true);
    setOrderingError(null);
    setOrderingSuccess(null);
  
    try {
      const response = await fetch("/api/restaurant-admin/ordering-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderingDraft),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
        restaurant?: {
          isAcceptingOrders: boolean;
          closedMessage: string;
        };
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok || !data.restaurant) {
        throw new Error(data.error ?? "No se pudo guardar el estado.");
      }
  
      setRestaurant((current) => ({
        ...current,
        isAcceptingOrders: data.restaurant?.isAcceptingOrders ?? true,
        closedMessage: data.restaurant?.closedMessage ?? current.closedMessage,
      }));
  
      setOrderingSuccess("Estado del restaurante guardado correctamente.");
    } catch (error) {
      setOrderingError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el estado del restaurante."
      );
    } finally {
      setOrderingSaving(false);
    }
  };



  const updateOpeningHour = (
    day: string,
    field: keyof OpeningHour,
    value: string | boolean
  ) => {
    setHoursDraft((current) => ({
      ...current,
      openingHours: current.openingHours.map((hour) =>
        hour.day === day ? { ...hour, [field]: value } : hour
      ),
    }));
  };
  
  const saveOpeningHours = async () => {
    setHoursSaving(true);
    setHoursError(null);
    setHoursSuccess(null);
  
    try {
      const response = await fetch("/api/restaurant-admin/opening-hours", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hoursDraft),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
        restaurant?: {
          openingHours: OpeningHour[];
          openingHoursNote: string;
          showOpeningHours: boolean;
          timeZone: string;
        };
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok || !data.restaurant) {
        throw new Error(data.error ?? "No se pudieron guardar los horarios.");
      }
  
      setRestaurant((current) => ({
        ...current,
        openingHours: data.restaurant?.openingHours ?? current.openingHours,
        openingHoursNote:
          data.restaurant?.openingHoursNote ?? current.openingHoursNote,
        showOpeningHours:
          data.restaurant?.showOpeningHours ?? current.showOpeningHours,
        timeZone: data.restaurant?.timeZone ?? current.timeZone,
      }));
  
      setHoursSuccess("Horarios guardados correctamente.");
    } catch (error) {
      setHoursError(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los horarios."
      );
    } finally {
      setHoursSaving(false);
    }
  };


  const logoutRestaurantAdmin = async () => {
    try {
      await fetch("/api/restaurant-auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("[Restaurant Logout Error]", error);
    } finally {
      window.location.href = "/login";
    }
  };


  const changeRestaurantPassword = async () => {
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);
  
    try {
      const response = await fetch("/api/restaurant-auth/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordDraft),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
        message?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo cambiar la contraseña.");
      }
  
      setPasswordDraft({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
  
      setPasswordSuccess(data.message ?? "Contraseña actualizada correctamente.");
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar la contraseña."
      );
    } finally {
      setPasswordSaving(false);
    }
  };




  const uploadRestaurantImage = async (
    file: File,
    kind: "logo" | "cover" | "product",
    uploadKey: string
  ) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("El archivo debe ser una imagen.");
    }
  
    const maxSizeBytes = kind === "logo" ? 2 * 1024 * 1024 : 4 * 1024 * 1024;
  
    if (file.size > maxSizeBytes) {
      throw new Error(
        kind === "logo"
          ? "El logo no debería pesar más de 2MB."
          : "La imagen no debería pesar más de 4MB."
      );
    }
  
    setImageUploadingKey(uploadKey);
  
    try {
      const formData = new FormData();
  
      formData.append("file", file);
      formData.append("kind", kind);
  
      const response = await fetch("/api/restaurant-admin/upload-image", {
        method: "POST",
        body: formData,
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        url?: string;
        error?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? "No se pudo subir la imagen.");
      }
  
      return data.url;
    } finally {
      setImageUploadingKey(null);
    }
  };



  const loadCashSummary = async () => {
    try {
      const response = await fetch("/api/restaurant-admin/cash/summary", {
        cache: "no-store",
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        summary?: typeof cashSummary;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        return;
      }
  
      if (response.ok && data.ok && data.summary) {
        setCashSummary(data.summary);
        setCashNotes(data.summary.existingClosure?.notes ?? "");
      }
    } catch (error) {
      console.error("[Load Cash Summary Error]", error);
    }
  };
  
  const closeCashDay = async () => {
    setCashSaving(true);
    setCashError(null);
    setCashSuccess(null);
  
    try {
      const response = await fetch("/api/restaurant-admin/cash/closures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: cashNotes,
        }),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
        closure?: CashClosureRecord;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok || !data.closure) {
        throw new Error(data.error ?? "No se pudo cerrar la caja.");
      }
  
      setCashSuccess("Cierre de caja guardado correctamente.");
      await loadCashSummary();
    } catch (error) {
      setCashError(
        error instanceof Error ? error.message : "No se pudo cerrar la caja."
      );
    } finally {
      setCashSaving(false);
    }
  };



  function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
    const nextItems = [...items];
    const [removedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, removedItem);
    return nextItems;
  }

  const moveCategory = async (categoryId: string, direction: "up" | "down") => {
    const currentIndex = restaurant.categories.findIndex(
      (category) => category.id === categoryId
    );
  
    if (currentIndex === -1) return;
  
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  
    if (nextIndex < 0 || nextIndex >= restaurant.categories.length) return;
  
    const nextCategories = moveArrayItem(
      restaurant.categories,
      currentIndex,
      nextIndex
    );
  
    setCategoryError(null);
    setCategorySuccess(null);
    setCategorySavingId(categoryId);
  
    try {
      const response = await fetch("/api/restaurant-admin/categories/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryIds: nextCategories.map((category) => category.id),
        }),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo ordenar la categoría.");
      }
  
      setRestaurant((current) => ({
        ...current,
        categories: nextCategories,
      }));
  
      setCategorySuccess("Orden de categorías actualizado.");
    } catch (error) {
      setCategoryError(
        error instanceof Error
          ? error.message
          : "No se pudo ordenar la categoría."
      );
    } finally {
      setCategorySavingId(null);
    }
  };


  const moveProduct = async (
    productId: string,
    categoryId: string,
    direction: "up" | "down"
  ) => {
    const categoryItems = restaurant.items.filter(
      (item) => item.categoryId === categoryId
    );
  
    const currentIndex = categoryItems.findIndex((item) => item.id === productId);
  
    if (currentIndex === -1) return;
  
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  
    if (nextIndex < 0 || nextIndex >= categoryItems.length) return;
  
    const nextCategoryItems = moveArrayItem(
      categoryItems,
      currentIndex,
      nextIndex
    );
  
    setProductError(null);
    setProductSuccess(null);
    setProductSavingId(productId);
  
    try {
      const response = await fetch("/api/restaurant-admin/products/reorder", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
          productIds: nextCategoryItems.map((item) => item.id),
        }),
      });
  
      const rawResponse = await response.text();
  
      let data: {
        ok?: boolean;
        error?: string;
      } = {};
  
      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(`La API no devolvió JSON. Status: ${response.status}.`);
      }
  
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo ordenar el producto.");
      }
  
      setRestaurant((current) => {
        const itemsFromOtherCategories = current.items.filter(
          (item) => item.categoryId !== categoryId
        );
  
        return {
          ...current,
          items: [...itemsFromOtherCategories, ...nextCategoryItems],
        };
      });
  
      setProductSuccess("Orden de productos actualizado.");
    } catch (error) {
      setProductError(
        error instanceof Error
          ? error.message
          : "No se pudo ordenar el producto."
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

  <button
    className={styles.logoutButton}
    onClick={logoutRestaurantAdmin}
    type="button"
  >
    Cerrar sesión
  </button>
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
          <div className={`${styles.stack} ${styles.overviewStack}`}>
            <section className={styles.heroSummary}>
              <div className={styles.heroSummaryPrimary}>
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
            <section className={`${styles.panel} ${styles.overviewPanelPrimary}`}>
  <div className={styles.panelHeader}>
    <div>
      <span className={styles.eyebrow}>Caja diaria</span>
      <h3>Cierre estimado del día</h3>
      <p>
        Estos datos se basan en pedidos enviados por WhatsApp. La venta final se
        confirma manualmente en el restaurante.
      </p>
    </div>

    <button
      className={styles.primaryButton}
      disabled={cashSaving}
      onClick={closeCashDay}
      type="button"
    >
      {cashSaving
        ? "Cerrando..."
        : cashSummary.existingClosure
          ? "Actualizar cierre"
          : "Cerrar caja"}
    </button>
  </div>

  {cashError ? (
    <div className={styles.errorBox}>{cashError}</div>
  ) : null}

  {cashSuccess ? (
    <div className={styles.successBox}>{cashSuccess}</div>
  ) : null}

  <section className={`${styles.metricGrid} ${styles.metricGridHighlight}`}>
    <article className={styles.metricCard}>
      <strong>{cashSummary.totalEvents}</strong>
      <span>pedidos enviados hoy</span>
    </article>

    <article className={styles.metricCard}>
      <strong>{money.format(cashSummary.totalEstimatedArs)}</strong>
      <span>total estimado hoy</span>
    </article>

    <article className={styles.metricCard}>
      <strong>{money.format(cashSummary.averageTicketArs)}</strong>
      <span>ticket promedio hoy</span>
    </article>

    <article className={styles.metricCard}>
      <strong>{cashSummary.totalItems}</strong>
      <span>productos enviados hoy</span>
    </article>
  </section>

  <div className={styles.overviewInfoGrid}>
    <div className={`${styles.publishCard} ${styles.overviewInfoCard}`}>
      <span>Fecha de caja</span>
      <strong>{cashSummary.businessDate || "Hoy"}</strong>
      <p>
        {cashSummary.existingClosure
          ? "Este día ya tiene un cierre guardado. Podés actualizarlo si hubo nuevos pedidos."
          : "Todavía no se guardó el cierre de caja de hoy."}
      </p>
    </div>

    <div className={`${styles.publishCard} ${styles.overviewInfoCard}`}>
      <span>Métodos de pago estimados</span>

      {Object.values(cashSummary.paymentBreakdown).length ? (
        Object.values(cashSummary.paymentBreakdown).map((payment) => (
          <p key={payment.label}>
            <strong>{payment.label}:</strong>{" "}
            {money.format(payment.totalArs)} · {payment.totalEvents} pedidos ·{" "}
            {payment.totalItems} productos
          </p>
        ))
      ) : (
        <p>No hay métodos de pago registrados hoy.</p>
      )}
    </div>

    <label className={`${styles.full} ${styles.overviewNotesCard}`}>
      <span>Notas del cierre</span>
      <textarea
        placeholder="Ej: Día con mucha demanda, faltaron productos, varios pedidos fueron por transferencia..."
        value={cashNotes}
        onChange={(event) => setCashNotes(event.target.value)}
      />
    </label>
  </div>
</section>

<section className={`${styles.panel} ${styles.overviewPanelSecondary}`}>
  <div className={styles.panelHeader}>
    <div>
      <span className={styles.eyebrow}>Historial</span>
      <h3>Últimos cierres de caja</h3>
    </div>
  </div>

  <div className={styles.overviewFeed}>
    {cashSummary.lastClosures.length ? (
      cashSummary.lastClosures.map((closure) => (
        <article className={`${styles.publishCard} ${styles.overviewFeedCard}`} key={closure.id}>
          <span>{closure.businessDate}</span>
          <strong>{money.format(closure.totalEstimatedArs)}</strong>
          <p>
            {closure.totalEvents} pedidos · {closure.totalItems} productos ·
            ticket promedio {money.format(closure.averageTicketArs)}
          </p>
          {closure.notes ? <p>{closure.notes}</p> : null}
        </article>
      ))
    ) : (
      <p>Todavía no hay cierres de caja guardados.</p>
    )}
  </div>
</section>

            <section className={`${styles.metricGrid} ${styles.metricGridSummary}`}>
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
              <article className={styles.metricCard}>
  <strong>{cartSummary.totalEvents}</strong>
  <span>pedidos enviados por WhatsApp</span>
</article>

<article className={styles.metricCard}>
  <strong>{money.format(cartSummary.totalEstimatedArs)}</strong>
  <span>total estimado generado</span>
</article>

<article className={styles.metricCard}>
  <strong>{money.format(cartSummary.averageTicketArs)}</strong>
  <span>ticket promedio estimado</span>
</article>
            </section>

            <section className={`${styles.panel} ${styles.overviewPanelSecondary}`}>
  <div className={styles.panelHeader}>
    <div>
      <span className={styles.eyebrow}>Pedidos aproximados</span>
      <h3>Últimos carritos enviados por WhatsApp</h3>
      <p>
        Estos datos representan pedidos enviados a WhatsApp, no ventas
        confirmadas por el restaurante.
      </p>
    </div>
  </div>

  <div className={styles.overviewFeed}>
    {cartSummary.lastEvents.length ? (
      cartSummary.lastEvents.map((event) => (
        <article className={`${styles.publishCard} ${styles.overviewFeedCard}`} key={event.id}>
          <span>{new Date(event.createdAt).toLocaleString("es-AR")}</span>
          <strong>{money.format(event.totalArs)}</strong>
          <p>
            {event.itemCount} productos · Pago: {event.paymentMethod}
          </p>
        </article>
      ))
    ) : (
      <p>Todavía no hay pedidos enviados por WhatsApp.</p>
    )}
  </div>
</section>

            <section className={`${styles.panel} ${styles.overviewPanelMuted}`}>
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
        <p>
          Estos datos se muestran en el menú público y se usan para enviar los
          pedidos por WhatsApp.
        </p>
      </div>

      <button
        className={styles.primaryButton}
        disabled={profileSaving}
        onClick={saveRestaurantProfile}
        type="button"
      >
        {profileSaving ? "Guardando..." : "Guardar datos"}
      </button>
    </div>

    {profileError ? (
      <div className={styles.errorBox}>{profileError}</div>
    ) : null}

    {profileSuccess ? (
      <div className={styles.successBox}>{profileSuccess}</div>
    ) : null}

    <div className={styles.formGrid}>
      <label>
        <span>Nombre del restaurante</span>
        <input
          value={restaurant.name}
          onChange={(event) =>
            updateRestaurant("name", event.target.value)
          }
        />
      </label>

      <label>
        <span>Ciudad</span>
        <input
          value={restaurant.city}
          onChange={(event) =>
            updateRestaurant("city", event.target.value)
          }
        />
      </label>

      <label>
        <span>Tipo de cocina</span>
        <input
          value={restaurant.cuisine}
          onChange={(event) =>
            updateRestaurant("cuisine", event.target.value)
          }
        />
      </label>

      <label>
        <span>WhatsApp pedidos</span>
        <input
          value={restaurant.customerWhatsapp}
          onChange={(event) =>
            updateRestaurant("customerWhatsapp", event.target.value)
          }
        />
      </label>

      <label className={styles.full}>
        <span>Descripción corta del local</span>
        <textarea
          value={restaurant.description}
          onChange={(event) =>
            updateRestaurant("description", event.target.value)
          }
        />
      </label>
      <label className={styles.full}>
  <span>Dirección del local</span>
  <input
    placeholder="Ej: Av. Siempre Viva 123, Córdoba"
    value={restaurant.address ?? ""}
    onChange={(event) =>
      updateRestaurant("address", event.target.value)
    }
  />
</label>

<label>
  <span>Instagram</span>
  <input
    placeholder="https://instagram.com/tu_local o @tu_local"
    value={restaurant.instagramUrl ?? ""}
    onChange={(event) =>
      updateRestaurant("instagramUrl", event.target.value)
    }
  />
</label>

<label>
  <span>Google Maps</span>
  <input
    placeholder="Link de Google Maps"
    value={restaurant.googleMapsUrl ?? ""}
    onChange={(event) =>
      updateRestaurant("googleMapsUrl", event.target.value)
    }
  />
</label>

<label className={styles.full}>
  <span>Zonas de delivery</span>
  <textarea
    placeholder="Ej: Nueva Córdoba, Centro, General Paz, Güemes"
    value={restaurant.deliveryZones ?? ""}
    onChange={(event) =>
      updateRestaurant("deliveryZones", event.target.value)
    }
  />
</label>

<label>
  <span>Tiempo estimado de entrega</span>
  <input
    placeholder="Ej: 35 a 50 min"
    value={restaurant.deliveryTimeEstimate ?? ""}
    onChange={(event) =>
      updateRestaurant("deliveryTimeEstimate", event.target.value)
    }
  />
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
  <button
    className={styles.primaryButton}
    disabled={categorySavingId === "new"}
    onClick={() => void addCategory()}
    type="button"
  >
    {categorySavingId === "new" ? "Creando..." : "Agregar categoria"}
  </button>
</div>

{categoryError ? (
  <div className={styles.errorBox}>{categoryError}</div>
) : null}

{categorySuccess ? (
  <div className={styles.successBox}>{categorySuccess}</div>
) : null}

            <div className={styles.stack}>
            {restaurant.categories.map((category, categoryIndex) => (
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
  <span>
    {restaurant.items.filter((item) => item.categoryId === category.id).length} productos asignados
  </span>

  <button
  className={styles.secondaryButton}
  disabled={categoryIndex === 0 || categorySavingId === category.id}
  onClick={() => void moveCategory(category.id, "up")}
  type="button"
>
  Subir
</button>

<button
  className={styles.secondaryButton}
  disabled={
    categoryIndex === restaurant.categories.length - 1 ||
    categorySavingId === category.id
  }
  onClick={() => void moveCategory(category.id, "down")}
  type="button"
>
  Bajar
</button>

  <button
    className={styles.primaryButton}
    disabled={categorySavingId === category.id}
    onClick={() => void saveCategory(category.id)}
    type="button"
  >
    {categorySavingId === category.id ? "Guardando..." : "Guardar categoria"}
  </button>

  <button
    className={styles.ghostDanger}
    disabled={restaurant.categories.length === 1 || categorySavingId === category.id}
    onClick={() => void deleteCategory(category.id)}
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

        {false ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Productos</span>
                <h3>Items, fotos, precios y borrado</h3>
              </div>
              <button
  className={styles.primaryButton}
  disabled={restaurant.categories.length === 0}
  onClick={() => {
    setProductDraft((current) => ({
      ...current,
      categoryId: restaurant.categories[0]?.id ?? "",
    }));
    setIsProductCreateOpen(true);
  }}
  type="button"
>
  Agregar producto
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
  onClick={() => {
    setProductDraft((current) => ({
      ...current,
      categoryId: category.id,
    }));
    setIsProductCreateOpen(true);
  }}
  type="button"
>
  Agregar en categoría
</button>
                  </div>

                  <div className={styles.stack}>
                  {category.items.map((item, itemIndex) => (
                      <article className={styles.productCard} key={item.id}>
                        <div className={styles.productCardHead}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{money.format(item.price)}</span>
                          </div>
                          <div className={styles.productActions}>
                          <button
  className={styles.secondaryButton}
  disabled={itemIndex === 0 || productSavingId === item.id}
  onClick={() => void moveProduct(item.id, category.id, "up")}
  type="button"
>
  Subir
</button>

<button
  className={styles.secondaryButton}
  disabled={
    itemIndex === category.items.length - 1 ||
    productSavingId === item.id
  }
  onClick={() => void moveProduct(item.id, category.id, "down")}
  type="button"
>
  Bajar
</button>

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
                        {productError ? (
  <div className={styles.errorBox}>{productError}</div>
) : null}

{productSuccess ? (
  <div className={styles.successBox}>{productSuccess}</div>
) : null}


{isProductCreateOpen ? (
  <section className={styles.createProductPanel}>
    <div className={styles.panelHeader}>
      <div>
        <span className={styles.eyebrow}>Nuevo producto</span>
        <h3>Cargar producto al menú</h3>
        <p>
          Completá los datos principales. Después podés editarlo nuevamente
          desde la lista.
        </p>
      </div>

      <button
        className={styles.secondaryButton}
        onClick={() => setIsProductCreateOpen(false)}
        type="button"
      >
        Cerrar
      </button>
    </div>

    <div className={styles.formGrid}>
      <label>
        <span>Nombre del producto</span>
        <input
          placeholder="Ej: Burger clásica"
          value={productDraft.name}
          onChange={(event) =>
            setProductDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
      </label>

      <label>
        <span>Categoría</span>
        <select
          value={productDraft.categoryId}
          onChange={(event) =>
            setProductDraft((current) => ({
              ...current,
              categoryId: event.target.value,
            }))
          }
        >
          {restaurant.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Precio</span>
        <input
          type="number"
          value={productDraft.price}
          onChange={(event) =>
            setProductDraft((current) => ({
              ...current,
              price: Number(event.target.value),
            }))
          }
        />
      </label>

      <label>
        <span>Tiempo estimado</span>
        <input
          placeholder="15 min"
          value={productDraft.prepTime}
          onChange={(event) =>
            setProductDraft((current) => ({
              ...current,
              prepTime: event.target.value,
            }))
          }
        />
      </label>

      <label className={styles.full}>
        <span>Descripción</span>
        <textarea
          placeholder="Descripción breve del producto..."
          value={productDraft.description}
          onChange={(event) =>
            setProductDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </label>

      <label className={styles.full}>
  <span>Imagen del producto</span>
  <input
    accept="image/*"
    type="file"
    onChange={handleProductDraftImageUpload}
  />

  {imageUploadingKey === "product-draft" ? (
    <small className={styles.uploadStatus}>Subiendo imagen...</small>
  ) : null}

  {productDraft.image ? (
    <div
      className={styles.imagePreview}
      style={{
        backgroundImage: `url(${productDraft.image})`,
      }}
    />
  ) : null}
</label>
    </div>

    <div className={styles.toggleRow}>
      <label className={styles.toggle}>
        <input
          checked={productDraft.available}
          type="checkbox"
          onChange={(event) =>
            setProductDraft((current) => ({
              ...current,
              available: event.target.checked,
            }))
          }
        />
        <span>{productDraft.available ? "Disponible" : "No disponible"}</span>
      </label>

      <label className={styles.toggle}>
        <input
          checked={productDraft.featured}
          type="checkbox"
          onChange={(event) =>
            setProductDraft((current) => ({
              ...current,
              featured: event.target.checked,
            }))
          }
        />
        <span>{productDraft.featured ? "Destacado" : "Normal"}</span>
      </label>
    </div>

    <div className={styles.productActions}>
      <button
        className={styles.primaryButton}
        disabled={productSavingId === "new"}
        onClick={() => createProduct()}
        type="button"
      >
        {productSavingId === "new" ? "Creando..." : "Crear producto"}
      </button>

      <button
        className={styles.secondaryButton}
        onClick={() => setIsProductCreateOpen(false)}
        type="button"
      >
        Cancelar
      </button>
    </div>
  </section>
) : null}

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
  <input
    accept="image/*"
    type="file"
    onChange={(event) => handleImageUpload(item.id, event)}
  />

  {imageUploadingKey === `product-${item.id}` ? (
    <small className={styles.uploadStatus}>Subiendo imagen...</small>
  ) : null}

  {item.image ? (
    <div
      className={styles.imagePreview}
      style={{ backgroundImage: `url(${item.image})` }}
    />
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

        {activeSection === "products" ? (
          <section className={`${styles.panel} ${styles.productsPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>Productos</span>
                <h3>Elegí un producto para editarlo</h3>
                <p>
                  La grilla muestra cada producto como una card compacta. Tocar uno para
                  abrir su editor y evitar confusiones al subir fotos o guardar cambios.
                </p>
              </div>
              <button
                className={styles.primaryButton}
                disabled={restaurant.categories.length === 0}
                onClick={() => {
                  setProductDraft((current) => ({
                    ...current,
                    categoryId: restaurant.categories[0]?.id ?? "",
                  }));
                  setActiveProductId(null);
                  setIsProductCreateOpen(true);
                }}
                type="button"
              >
                Agregar producto
              </button>
            </div>

            {productError ? <div className={styles.errorBox}>{productError}</div> : null}
            {productSuccess ? (
              <div className={styles.successBox}>{productSuccess}</div>
            ) : null}

            {isProductCreateOpen ? (
              <section className={`${styles.createProductPanel} ${styles.productCreatePanel}`}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>Nuevo producto</span>
                    <h3>Cargar producto al menÃº</h3>
                    <p>
                      CompletÃ¡ los datos principales y despuÃ©s, si querÃ©s, lo seguÃ­s
                      editando desde su card.
                    </p>
                  </div>

                  <button
                    className={styles.secondaryButton}
                    onClick={() => setIsProductCreateOpen(false)}
                    type="button"
                  >
                    Cerrar
                  </button>
                </div>

                <div className={styles.formGrid}>
                  <label>
                    <span>Nombre del producto</span>
                    <input
                      placeholder="Ej: Burger clÃ¡sica"
                      value={productDraft.name}
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>CategorÃ­a</span>
                    <select
                      value={productDraft.categoryId}
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          categoryId: event.target.value,
                        }))
                      }
                    >
                      {restaurant.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Precio</span>
                    <input
                      type="number"
                      value={productDraft.price}
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          price: Number(event.target.value),
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Tiempo estimado</span>
                    <input
                      placeholder="15 min"
                      value={productDraft.prepTime}
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          prepTime: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.full}>
                    <span>DescripciÃ³n</span>
                    <textarea
                      placeholder="DescripciÃ³n breve del producto..."
                      value={productDraft.description}
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className={styles.full}>
                    <span>Imagen del producto</span>
                    <input
                      accept="image/*"
                      type="file"
                      onChange={handleProductDraftImageUpload}
                    />

                    {imageUploadingKey === "product-draft" ? (
                      <small className={styles.uploadStatus}>Subiendo imagen...</small>
                    ) : null}

                    {productDraft.image ? (
                      <div
                        className={styles.imagePreview}
                        style={{ backgroundImage: `url(${productDraft.image})` }}
                      />
                    ) : (
                      <div className={styles.emptyUploadPreview}>TodavÃ­a sin imagen</div>
                    )}
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <label className={styles.toggle}>
                    <input
                      checked={productDraft.available}
                      type="checkbox"
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          available: event.target.checked,
                        }))
                      }
                    />
                    <span>{productDraft.available ? "Disponible" : "No disponible"}</span>
                  </label>

                  <label className={styles.toggle}>
                    <input
                      checked={productDraft.featured}
                      type="checkbox"
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          featured: event.target.checked,
                        }))
                      }
                    />
                    <span>{productDraft.featured ? "Destacado" : "Normal"}</span>
                  </label>
                </div>

                <div className={styles.productActions}>
                  <button
                    className={styles.primaryButton}
                    disabled={productSavingId === "new"}
                    onClick={() => createProduct()}
                    type="button"
                  >
                    {productSavingId === "new" ? "Creando..." : "Crear producto"}
                  </button>

                  <button
                    className={styles.secondaryButton}
                    onClick={() => setIsProductCreateOpen(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </section>
            ) : null}

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
                      onClick={() => {
                        setProductDraft((current) => ({
                          ...current,
                          categoryId: category.id,
                        }));
                        setActiveProductId(null);
                        setIsProductCreateOpen(true);
                      }}
                      type="button"
                    >
                      Agregar en categoría
                    </button>
                  </div>

                  {category.items.length ? (
                    <div className={styles.productGallery}>
                      {category.items.map((item) => (
                        <button
                          aria-label={`Editar ${item.name}`}
                          className={
                            activeProductId === item.id
                              ? styles.productThumbCardActive
                              : styles.productThumbCard
                          }
                          key={item.id}
                          onClick={() => {
                            setIsProductCreateOpen(false);
                            setActiveProductId(item.id);
                          }}
                          type="button"
                        >
                          <div
                            className={styles.productThumbImage}
                            style={
                              item.image
                                ? { backgroundImage: `url(${item.image})` }
                                : undefined
                            }
                          >
                            {!item.image ? (
                              <div className={styles.productThumbFallback}>
                                {item.name.slice(0, 1)}
                              </div>
                            ) : null}
                            {item.featured ? (
                              <span className={styles.productThumbBadge}>Destacado</span>
                            ) : null}
                            {!item.available ? (
                              <span className={styles.productThumbBadgeMuted}>Pausado</span>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyProductState}>
                      <strong>Sin productos en esta categorÃ­a</strong>
                      <p>UsÃ¡ el botÃ³n de arriba para cargar el primero.</p>
                    </div>
                  )}

                  {activeProduct && activeProduct.categoryId === category.id ? (
                    <article className={`${styles.productCard} ${styles.productEditorCard}`}>
                      <div className={styles.productCardHead}>
                        <div>
                          <span className={styles.eyebrow}>Producto en ediciÃ³n</span>
                          <strong>{activeProduct.name}</strong>
                          <span>
                            {money.format(activeProduct.price)} Â· {activeProductCategory?.name}
                          </span>
                        </div>
                        <div className={styles.productActions}>
                          <button
                            className={styles.secondaryButton}
                            disabled={activeProductIndex <= 0 || productSavingId === activeProduct.id}
                            onClick={() =>
                              void moveProduct(activeProduct.id, category.id, "up")
                            }
                            type="button"
                          >
                            Subir
                          </button>

                          <button
                            className={styles.secondaryButton}
                            disabled={
                              activeProductIndex === activeProductCategoryItems.length - 1 ||
                              productSavingId === activeProduct.id
                            }
                            onClick={() =>
                              void moveProduct(activeProduct.id, category.id, "down")
                            }
                            type="button"
                          >
                            Bajar
                          </button>

                          <button
                            className={styles.primaryButton}
                            disabled={productSavingId === activeProduct.id}
                            onClick={() => saveProduct(activeProduct.id)}
                            type="button"
                          >
                            {productSavingId === activeProduct.id
                              ? "Guardando..."
                              : "Guardar producto"}
                          </button>

                          <button
                            className={styles.ghostDanger}
                            disabled={productSavingId === activeProduct.id}
                            onClick={() => deleteProduct(activeProduct.id)}
                            type="button"
                          >
                            Eliminar producto
                          </button>

                          <button
                            className={styles.secondaryButton}
                            onClick={() => setActiveProductId(null)}
                            type="button"
                          >
                            Cerrar editor
                          </button>
                        </div>
                      </div>

                      <div className={styles.formGrid}>
                        <label>
                          <span>Producto</span>
                          <input
                            value={activeProduct.name}
                            onChange={(event) =>
                              updateItem(activeProduct.id, "name", event.target.value)
                            }
                          />
                        </label>
                        <label>
                          <span>Precio</span>
                          <input
                            type="number"
                            value={activeProduct.price}
                            onChange={(event) =>
                              updateItem(
                                activeProduct.id,
                                "price",
                                Number(event.target.value)
                              )
                            }
                          />
                        </label>
                        <label>
                          <span>Categoria</span>
                          <select
                            value={activeProduct.categoryId}
                            onChange={(event) =>
                              updateItem(activeProduct.id, "categoryId", event.target.value)
                            }
                          >
                            {restaurant.categories.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Tiempo estimado</span>
                          <input
                            value={activeProduct.prepTime}
                            onChange={(event) =>
                              updateItem(activeProduct.id, "prepTime", event.target.value)
                            }
                          />
                        </label>
                        <label className={styles.full}>
                          <span>Descripcion</span>
                          <textarea
                            value={activeProduct.description}
                            onChange={(event) =>
                              updateItem(
                                activeProduct.id,
                                "description",
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className={styles.full}>
                          <span>Foto del producto</span>
                          <input
                            accept="image/*"
                            type="file"
                            onChange={(event) => handleImageUpload(activeProduct.id, event)}
                          />

                          {imageUploadingKey === `product-${activeProduct.id}` ? (
                            <small className={styles.uploadStatus}>Subiendo imagen...</small>
                          ) : null}

                          {activeProduct.image ? (
                            <div
                              className={styles.imagePreview}
                              style={{ backgroundImage: `url(${activeProduct.image})` }}
                            />
                          ) : (
                            <div className={styles.emptyUploadPreview}>TodavÃ­a sin imagen</div>
                          )}
                        </label>
                      </div>

                      <div className={styles.toggleRow}>
                        <label className={styles.toggle}>
                          <input
                            checked={activeProduct.available}
                            type="checkbox"
                            onChange={(event) =>
                              updateItem(
                                activeProduct.id,
                                "available",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            {activeProduct.available ? "Disponible" : "No disponible"}
                          </span>
                        </label>
                        <label className={styles.toggle}>
                          <input
                            checked={activeProduct.featured}
                            type="checkbox"
                            onChange={(event) =>
                              updateItem(
                                activeProduct.id,
                                "featured",
                                event.target.checked
                              )
                            }
                          />
                          <span>{activeProduct.featured ? "Destacado" : "Normal"}</span>
                        </label>
                      </div>
                    </article>
                  ) : null}
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
        <span className={styles.eyebrow}>Experiencia visual</span>
<h3>Elegí cómo se siente tu menú</h3>
<p>
  Cada plantilla cambia colores, forma de botones, tamaño de imágenes,
  estilo de cards y personalidad general del menú público.
</p>
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

            <div className={styles.templateInfo}>
  <div className={styles.templateTitleRow}>
    <strong>{template.name}</strong>
    <span>{template.badge}</span>
  </div>

  <p>{template.description}</p>

  <div className={styles.templateDetails}>
    <small>Recomendado para</small>
    <p>{template.bestFor}</p>
  </div>

  <div className={styles.templateDetails}>
    <small>Estilo visual</small>
    <p>{template.visualStyle}</p>
  </div>
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
      <p>
        Subí el logo y una portada para personalizar el menú público del
        restaurante.
      </p>
    </div>
  </div>

  <div className={styles.imageUploadGrid}>
    <label className={styles.uploadBox}>
      <span>Logo del restaurante</span>

      <input
        accept="image/*"
        type="file"
        onChange={(event) =>
          handleAppearanceImageUpload("logoUrl", event)
        }
      />

{imageUploadingKey === "logoUrl" ? (
  <small className={styles.uploadStatus}>Subiendo logo...</small>
) : null}

      {appearanceDraft.logoUrl ? (
        <img
          className={styles.logoUploadPreview}
          src={appearanceDraft.logoUrl}
          alt="Logo del restaurante"
        />
      ) : (
        <div className={styles.emptyUploadPreview}>
          Sin logo cargado
        </div>
      )}

      {appearanceDraft.logoUrl ? (
        <button
          className={styles.secondaryButton}
          onClick={() => updateAppearanceDraft("logoUrl", "")}
          type="button"
        >
          Quitar logo
        </button>
      ) : null}
    </label>

    <label className={styles.uploadBox}>
      <span>Imagen de portada</span>

      <input
        accept="image/*"
        type="file"
        onChange={(event) =>
          handleAppearanceImageUpload("coverImageUrl", event)
        }
      />

{imageUploadingKey === "coverImageUrl" ? (
  <small className={styles.uploadStatus}>Subiendo portada...</small>
) : null}

      {appearanceDraft.coverImageUrl ? (
        <img
          className={styles.coverUploadPreview}
          src={appearanceDraft.coverImageUrl}
          alt="Imagen de portada"
        />
      ) : (
        <div className={styles.emptyUploadPreview}>
          Sin portada cargada
        </div>
      )}

      {appearanceDraft.coverImageUrl ? (
        <button
          className={styles.secondaryButton}
          onClick={() => updateAppearanceDraft("coverImageUrl", "")}
          type="button"
        >
          Quitar portada
        </button>
      ) : null}
    </label>
  </div>
</section>

    <section className={`${styles.panel} ${styles.appearancePanel}`}>
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

    <section className={`${styles.panel} ${styles.previewPanel}`}>
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
    background: appearanceDraft.coverImageUrl
      ? `${appearanceDraft.heroGradient}, url(${appearanceDraft.coverImageUrl}) center/cover`
      : appearanceDraft.heroGradient,
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
          <article className={styles.previewProductCard} style={{ background: appearanceDraft.surfaceAlt }}>
            <strong>Producto destacado</strong>
            <span>$ 9.900</span>
          </article>

          <article className={styles.previewProductCard} style={{ background: appearanceDraft.surfaceAlt }}>
            <strong>Combo especial</strong>
            <span>$ 12.500</span>
          </article>
        </div>
      </div>
    </section>
  </div>
) : null}


{activeSection === "security" ? (
  <div className={styles.stack}>
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Seguridad</span>
          <h3>Cambiar contraseña</h3>
          <p>
            Usá esta opción para reemplazar la contraseña temporal asignada al
            restaurante.
          </p>
        </div>

        <button
          className={styles.primaryButton}
          disabled={passwordSaving}
          onClick={changeRestaurantPassword}
          type="button"
        >
          {passwordSaving ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </div>

      {passwordError ? (
        <div className={styles.errorBox}>{passwordError}</div>
      ) : null}

      {passwordSuccess ? (
        <div className={styles.successBox}>{passwordSuccess}</div>
      ) : null}

      <div className={styles.formGrid}>
        <label className={styles.full}>
          <span>Contraseña actual</span>
          <input
            autoComplete="current-password"
            type="password"
            value={passwordDraft.currentPassword}
            onChange={(event) =>
              setPasswordDraft((current) => ({
                ...current,
                currentPassword: event.target.value,
              }))
            }
          />
        </label>

        <label>
          <span>Nueva contraseña</span>
          <input
            autoComplete="new-password"
            type="password"
            value={passwordDraft.newPassword}
            onChange={(event) =>
              setPasswordDraft((current) => ({
                ...current,
                newPassword: event.target.value,
              }))
            }
          />
        </label>

        <label>
          <span>Confirmar nueva contraseña</span>
          <input
            autoComplete="new-password"
            type="password"
            value={passwordDraft.confirmPassword}
            onChange={(event) =>
              setPasswordDraft((current) => ({
                ...current,
                confirmPassword: event.target.value,
              }))
            }
          />
        </label>
      </div>
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.eyebrow}>Recomendación</span>
          <h3>Usá una contraseña segura</h3>
        </div>
      </div>

      <ul className={styles.todoList}>
        <li>Mínimo 8 caracteres.</li>
        <li>Mezclar letras, números y símbolos.</li>
        <li>No compartir la contraseña con empleados no autorizados.</li>
        <li>Cambiarla si alguien deja de trabajar en el restaurante.</li>
      </ul>
    </section>
  </div>
) : null}



        {activeSection === "publishing" ? (
          
          <div className={`${styles.stack} ${styles.publishingStack}`}>
            <section className={`${styles.panel} ${styles.publishingHeroPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.eyebrow}>Publicacion</span>
                  <h3>Destino real del producto</h3>
                </div>
              </div>
              <div className={`${styles.publishGrid} ${styles.publishingGrid}`}>
                <div className={`${styles.publishCard} ${styles.publishingCard}`}>
                  <span>Subdominio activo</span>
                  <strong>{publicUrl}</strong>
                </div>
                <div className={`${styles.publishCard} ${styles.publishingCard}`}>
                  <span>WhatsApp receptor</span>
                  <strong>{adminWhatsappUrl}</strong>
                </div>
                <div className={`${styles.publishCard} ${styles.publishingCard}`}>
                  <span>Uso principal</span>
                  <strong>Delivery y take away desde menu web</strong>
                </div>
              </div>
            </section>
            
            <section className={`${styles.panel} ${styles.publishingEditorPanel}`}>
  <div className={styles.panelHeader}>
    <div>
      <span className={styles.eyebrow}>WhatsApp</span>
      <h3>Mensaje personalizado del carrito</h3>
      <p>
        Este texto se usa cuando el cliente toca “Enviar pedido por WhatsApp”.
      </p>
    </div>

    <button
      className={styles.primaryButton}
      disabled={whatsappSaving}
      onClick={saveWhatsappMessage}
      type="button"
    >
      {whatsappSaving ? "Guardando..." : "Guardar mensaje"}
    </button>
  </div>

  {whatsappError ? (
    <div className={styles.errorBox}>{whatsappError}</div>
  ) : null}

  {whatsappSuccess ? (
    <div className={styles.successBox}>{whatsappSuccess}</div>
  ) : null}

  <div className={styles.formGrid}>
    <label className={styles.full}>
      <span>Mensaje inicial</span>
      <textarea
        value={whatsappDraft.whatsappIntroMessage}
        onChange={(event) =>
          setWhatsappDraft((current) => ({
            ...current,
            whatsappIntroMessage: event.target.value,
          }))
        }
      />
    </label>

    <label className={styles.full}>
      <span>Mensaje final</span>
      <textarea
        value={whatsappDraft.whatsappFooterMessage}
        onChange={(event) =>
          setWhatsappDraft((current) => ({
            ...current,
            whatsappFooterMessage: event.target.value,
          }))
        }
      />
    </label>
  </div>

  <div className={`${styles.publishCard} ${styles.previewMessageCard}`}>
    <span>Vista previa</span>
    <strong>
      {whatsappDraft.whatsappIntroMessage || "Mensaje inicial"}
    </strong>
    <p>
      - 2x Producto ejemplo - $ 10.000<br />
      Total estimado: $ 10.000<br />
      Dirección de entrega: A confirmar<br />
      Forma de pago: Efectivo<br />
      {whatsappDraft.whatsappFooterMessage}
    </p>
  </div>
</section>

<section className={`${styles.panel} ${styles.publishingEditorPanel}`}>
  <div className={styles.panelHeader}>
    <div>
    <span className={styles.eyebrow}>Pausa manual</span>
<h3>Pausar pedidos temporalmente</h3>
<p>
  Los horarios se calculan automáticamente. Usá esta opción solo si necesitás
  pausar pedidos por alta demanda, falta de stock o cierre excepcional.
</p>
    </div>

    <button
      className={styles.primaryButton}
      disabled={orderingSaving}
      onClick={saveOrderingStatus}
      type="button"
    >
      {orderingSaving ? "Guardando..." : "Guardar estado"}
    </button>
  </div>

  {orderingError ? (
    <div className={styles.errorBox}>{orderingError}</div>
  ) : null}

  {orderingSuccess ? (
    <div className={styles.successBox}>{orderingSuccess}</div>
  ) : null}

  <div className={styles.formGrid}>
    <label className={styles.full}>
      <span>Estado de pedidos</span>

      <select
  value={orderingDraft.isAcceptingOrders ? "automatic" : "paused"}
  onChange={(event) =>
    setOrderingDraft((current) => ({
      ...current,
      isAcceptingOrders: event.target.value === "automatic",
    }))
  }
>
  <option value="automatic">Automático según horarios</option>
  <option value="paused">Pausado manualmente</option>
</select>
    </label>

    <label className={styles.full}>
      <span>Mensaje cuando está cerrado</span>
      <textarea
        value={orderingDraft.closedMessage}
        onChange={(event) =>
          setOrderingDraft((current) => ({
            ...current,
            closedMessage: event.target.value,
          }))
        }
      />
    </label>
  </div>

  <div className={`${styles.publishCard} ${styles.previewMessageCard}`}>
    <span>Vista previa</span>
    <strong>
      {orderingDraft.isAcceptingOrders
        ? "Menú abierto"
        : "Menú cerrado"}
    </strong>
    <p>
      {orderingDraft.isAcceptingOrders
        ? "Los clientes pueden enviar pedidos por WhatsApp."
        : orderingDraft.closedMessage}
    </p>
  </div>
</section>

<section className={`${styles.panel} ${styles.publishingEditorPanel}`}>
  <div className={styles.panelHeader}>
    <div>
      <span className={styles.eyebrow}>Horarios</span>
      <h3>Horarios de atención</h3>
      <p>
        Mostrá en el menú público cuándo el restaurante atiende pedidos.
      </p>
    </div>

    <button
      className={styles.primaryButton}
      disabled={hoursSaving}
      onClick={saveOpeningHours}
      type="button"
    >
      {hoursSaving ? "Guardando..." : "Guardar horarios"}
    </button>
  </div>

  {hoursError ? (
    <div className={styles.errorBox}>{hoursError}</div>
  ) : null}

  {hoursSuccess ? (
    <div className={styles.successBox}>{hoursSuccess}</div>
  ) : null}

<div className={styles.formGrid}>
  <label className={styles.full}>
    <span>Mostrar horarios en el menú público</span>
    <select
      value={hoursDraft.showOpeningHours ? "show" : "hide"}
      onChange={(event) =>
        setHoursDraft((current) => ({
          ...current,
          showOpeningHours: event.target.value === "show",
        }))
      }
    >
      <option value="show">Sí, mostrar horarios</option>
      <option value="hide">No, ocultar horarios</option>
    </select>
  </label>
  <label className={styles.full}>
  <span>Zona horaria del restaurante</span>
  <select
    value={hoursDraft.timeZone}
    onChange={(event) =>
      setHoursDraft((current) => ({
        ...current,
        timeZone: event.target.value,
      }))
    }
  >
    <option value="America/Argentina/Cordoba">Argentina - Córdoba</option>
    <option value="America/Argentina/Buenos_Aires">Argentina - Buenos Aires</option>
    <option value="America/Caracas">Venezuela</option>
    <option value="America/Bogota">Colombia / Perú</option>
    <option value="America/Santiago">Chile</option>
    <option value="America/Mexico_City">México</option>
    <option value="Europe/Madrid">España</option>
  </select>
</label>
</div>

  <div className={styles.stack}>
    {hoursDraft.openingHours.map((hour) => (
      <article className={`${styles.categoryCard} ${styles.scheduleCard}`} key={hour.day}>
        <div className={styles.formGrid}>
          <label>
            <span>Día</span>
            <input value={hour.label} readOnly />
          </label>

          <label>
            <span>Estado</span>
            <select
              value={hour.enabled ? "open" : "closed"}
              onChange={(event) =>
                updateOpeningHour(
                  hour.day,
                  "enabled",
                  event.target.value === "open"
                )
              }
            >
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
            </select>
          </label>

          <label>
            <span>Apertura</span>
            <input
              type="time"
              value={hour.openTime}
              onChange={(event) =>
                updateOpeningHour(hour.day, "openTime", event.target.value)
              }
            />
          </label>

          <label>
            <span>Cierre</span>
            <input
              type="time"
              value={hour.closeTime}
              onChange={(event) =>
                updateOpeningHour(hour.day, "closeTime", event.target.value)
              }
            />
          </label>
        </div>
      </article>
    ))}
  </div>

  <div className={styles.formGrid}>
    <label className={styles.full}>
      <span>Nota sobre horarios</span>
      <textarea
        value={hoursDraft.openingHoursNote}
        onChange={(event) =>
          setHoursDraft((current) => ({
            ...current,
            openingHoursNote: event.target.value,
          }))
        }
      />
    </label>
  </div>
</section>

            <section className={`${styles.panel} ${styles.helperPanel}`}>
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
