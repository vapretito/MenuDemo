import type { RestaurantRecord } from "@/types/platform";
import type {
  Category,
  Product,
  Restaurant,
  Subscription,
} from "@/generated/prisma/client";

type RestaurantWithRelations = Restaurant & {
  categories: Category[];
  products: Product[];
  subscription: Subscription | null;
};

const toLowerStatus = (status: string): RestaurantRecord["status"] => {
  const normalized = status.toLowerCase();

  if (
    normalized === "trial" ||
    normalized === "active" ||
    normalized === "past_due" ||
    normalized === "suspended" ||
    normalized === "cancelled" ||
    normalized === "manual"
  ) {
    return normalized;
  }

  return "trial";
};

const toBillingMode = (mode: string): RestaurantRecord["billingMode"] => {
  return mode === "MANUAL" ? "manual" : "mercado_pago_subscription";
};

const toCollectionMethod = (method?: string | null) => {
  return method === "MANUAL" ? "manual" : "automatic";
};

export function mapRestaurantToRecord(
  restaurant: RestaurantWithRelations
): RestaurantRecord {
  const subscription = restaurant.subscription;

  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    subdomain: restaurant.subdomain,
    dnsStatus:
      restaurant.dnsStatus === "CONFIGURED"
        ? "configured"
        : restaurant.dnsStatus === "ERROR"
          ? "error"
          : "pending",
    connectedToDemo: restaurant.connectedToDemo,
    billingMode: toBillingMode(restaurant.billingMode),
    city: restaurant.city,
    cuisine: restaurant.cuisine,
    description: restaurant.description,
    status: toLowerStatus(restaurant.status),
    adminName: restaurant.adminName ?? "",
    adminWhatsapp: restaurant.adminWhatsapp ?? restaurant.customerWhatsapp,
    customerWhatsapp: restaurant.customerWhatsapp,
    onboardingNote: restaurant.onboardingNote ?? "",
    graceUntil: restaurant.graceUntil
      ? restaurant.graceUntil.toISOString().slice(0, 10)
      : null,
    subscription: {
      planId: subscription?.planId ?? "basic",
      plan: subscription?.planName ?? "Menui Basic",
      amountArs: subscription?.amountArs ?? 0,
      cycle: subscription?.cycle ?? "monthly",
      mercadopagoPreapprovalId:
        subscription?.mercadopagoPreapprovalId ?? "pendiente",
      collectionMethod: toCollectionMethod(subscription?.collectionMethod),
      status: subscription?.status
        ? subscription.status.toLowerCase()
        : "scheduled",
      renewsOn: subscription?.renewsOn
        ? subscription.renewsOn.toISOString().slice(0, 10)
        : "sin fecha",
    },
    metrics: {
      monthlyOrders: 0,
      monthlyRevenueArs: 0,
      conversionRate: 0,
    },
    theme: {
      accent: restaurant.accent,
      accentSoft: restaurant.accentSoft,
      surface: restaurant.surface,
      surfaceAlt: restaurant.surfaceAlt,
      border: restaurant.border,
      text: restaurant.text,
      muted: restaurant.muted,
      heroGradient: restaurant.heroGradient,
    },
    categories: restaurant.categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
    })),
    items: restaurant.products.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      price: product.priceArs,
      image: product.image ?? "",
      featured: product.featured,
      available: product.available,
      prepTime: product.prepTime,
    })),
  };
}