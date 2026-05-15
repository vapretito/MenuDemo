export type MenuCategory = {
  id: string;
  name: string;
  description: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  available: boolean;
  prepTime: string;
};

export type RestaurantTheme = {
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  heroGradient: string;
};

export type RestaurantStatus =
  | "trial"
  | "active"
  | "past_due"
  | "suspended"
  | "cancelled"
  | "manual";
export type DnsSetupStatus = "pending" | "configured";
export type PlanId = "basic" | "pro" | "premium";
export type BillingMode = "mercado_pago_subscription" | "manual";
export type PaymentStatus =
  | "pending"
  | "approved"
  | "failed"
  | "cancelled";

export type PlanRecord = {
  id: PlanId;
  name: string;
  price: number;
  productLimit: number;
  features: string[];
};

export type RestaurantSubscription = {
  planId: PlanId;
  plan: string;
  amountArs: number;
  cycle: "monthly";
  mercadopagoPreapprovalId: string;
  collectionMethod: "automatic" | "manual";
  status: "active" | "scheduled" | "requires_attention";
  renewsOn: string;
};

export type RestaurantMetrics = {
  monthlyOrders: number;
  monthlyRevenueArs: number;
  conversionRate: number;
};

export type RestaurantRecord = {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  dnsStatus: DnsSetupStatus;
  connectedToDemo: boolean;
  billingMode: BillingMode;
  city: string;
  cuisine: string;
  description: string;
  status: RestaurantStatus;
  adminName: string;
  adminWhatsapp: string;
  customerWhatsapp: string;
  onboardingNote: string;
  graceUntil: string | null;
  subscription: RestaurantSubscription;
  metrics: RestaurantMetrics;
  theme: RestaurantTheme;
  categories: MenuCategory[];
  items: MenuItem[];
};

export type RestaurantCreationInput = {
  name: string;
  slug: string;
  subdomain: string;
  city: string;
  cuisine: string;
  adminName: string;
  customerWhatsapp: string;
  planId: PlanId;
  status: RestaurantStatus;
  billingMode: BillingMode;
};

export type CartLine = {
  itemId: string;
  quantity: number;
};

export type PlatformSnapshot = {
  brandName: string;
  domain: string;
  monthlyPlanArs: number;
  mercadopagoNote: string;
  plans: PlanRecord[];
  restaurants: RestaurantRecord[];
};

export type PaymentRecord = {
  id: string;
  restaurantId: string;
  amount: number;
  status: PaymentStatus;
  mercadoPagoPaymentId: string;
  mercadoPagoSubscriptionId: string;
  paidAt: string;
};
