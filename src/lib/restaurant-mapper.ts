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

type FrontRestaurantStatus = RestaurantRecord["status"];
type FrontDnsStatus = RestaurantRecord["dnsStatus"];
type FrontBillingMode = RestaurantRecord["billingMode"];
type FrontSubscription = RestaurantRecord["subscription"];
type FrontPlanId = FrontSubscription["planId"];
type FrontCycle = FrontSubscription["cycle"];
type FrontSubscriptionStatus = FrontSubscription["status"];
type FrontCollectionMethod = FrontSubscription["collectionMethod"];

const normalizeRestaurantStatus = (status: string): FrontRestaurantStatus => {
  const normalized = status.toLowerCase();

  if (
    normalized === "trial" ||
    normalized === "active" ||
    normalized === "past_due" ||
    normalized === "suspended" ||
    normalized === "cancelled" ||
    normalized === "manual"
  ) {
    return normalized as FrontRestaurantStatus;
  }

  return "trial";
};

const normalizeDnsStatus = (status: string): FrontDnsStatus => {
  return status === "CONFIGURED" ? "configured" : "pending";
};

const normalizeBillingMode = (mode: string): FrontBillingMode => {
  return mode === "MANUAL" ? "manual" : "mercado_pago_subscription";
};

const normalizePlanId = (planId?: string | null): FrontPlanId => {
  if (planId === "basic") {
    return "basic" as FrontPlanId;
  }

  if (planId === "pro") {
    return "pro" as FrontPlanId;
  }

  if (planId === "premium") {
    return "premium" as FrontPlanId;
  }

  return "basic" as FrontPlanId;
};

const normalizeCycle = (): FrontCycle => {
  return "monthly";
};

const normalizeCollectionMethod = (
  method?: string | null
): FrontCollectionMethod => {
  return method === "MANUAL" ? "manual" : "automatic";
};

const normalizeSubscriptionStatus = (
  status?: string | null
): FrontSubscriptionStatus => {
  const normalized = status?.toLowerCase();

  if (
    normalized === "active" ||
    normalized === "scheduled" ||
    normalized === "requires_attention"
  ) {
    return normalized as FrontSubscriptionStatus;
  }

  if (
    normalized === "pending" ||
    normalized === "authorized" ||
    normalized === "paused"
  ) {
    return "scheduled";
  }

  if (
    normalized === "cancelled" ||
    normalized === "past_due" ||
    normalized === "ended"
  ) {
    return "requires_attention";
  }

  return "scheduled";
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
    dnsStatus: normalizeDnsStatus(restaurant.dnsStatus),
    connectedToDemo: restaurant.connectedToDemo,
    billingMode: normalizeBillingMode(restaurant.billingMode),
    city: restaurant.city,
    cuisine: restaurant.cuisine,
    description: restaurant.description,
    status: normalizeRestaurantStatus(restaurant.status),
    adminName: restaurant.adminName ?? "",
    adminWhatsapp: restaurant.adminWhatsapp ?? restaurant.customerWhatsapp,
    customerWhatsapp: restaurant.customerWhatsapp,
    onboardingNote: restaurant.onboardingNote ?? "",
    graceUntil: restaurant.graceUntil
      ? restaurant.graceUntil.toISOString().slice(0, 10)
      : null,

    subscription: {
      planId: normalizePlanId(subscription?.planId),
      plan: subscription?.planName ?? "Menui Basic",
      amountArs: subscription?.amountArs ?? 0,
      cycle: normalizeCycle(),
      mercadopagoPreapprovalId:
        subscription?.mercadopagoPreapprovalId ?? "pendiente",
      collectionMethod: normalizeCollectionMethod(
        subscription?.collectionMethod
      ),
      status: normalizeSubscriptionStatus(subscription?.status),
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