import { PlanRecord, PlatformSnapshot, RestaurantRecord } from "@/types/platform";

export const planCatalog: PlanRecord[] = [
  {
    id: "basic",
    name: "Basic",
    price: 20000,
    productLimit: 40,
    features: ["Menu mobile", "Carrito WhatsApp", "1 admin"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 39900,
    productLimit: 120,
    features: ["Todo Basic", "Fotos ilimitadas", "Soporte prioritario"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 65000,
    productLimit: 300,
    features: ["Todo Pro", "Multi sucursal", "Custom onboarding"],
  },
];

const subwayDemo: RestaurantRecord = {
  id: "rest-subway-demo",
  name: "Subway Central",
  slug: "subway",
  subdomain: "subway.menui.oi",
  dnsStatus: "configured",
  connectedToDemo: true,
  billingMode: "mercado_pago_subscription",
  city: "Buenos Aires",
  cuisine: "Sandwiches y wraps",
  description:
    "Menu digital para delivery con foco en compra rapida, personalizacion visual y pedido directo a WhatsApp.",
  status: "active",
  adminName: "Lucia Ferreyra",
  adminWhatsapp: "5491133345566",
  customerWhatsapp: "5491133345566",
  onboardingNote:
    "Sucursal piloto para validar menu mobile, carrito y derivacion de pedidos por WhatsApp.",
  graceUntil: "2026-06-08",
  subscription: {
    planId: "pro",
    plan: "Menui Growth",
    amountArs: 39900,
    cycle: "monthly",
    mercadopagoPreapprovalId: "mp-preapproval-subway-001",
    collectionMethod: "automatic",
    status: "active",
    renewsOn: "2026-06-03",
  },
  metrics: {
    monthlyOrders: 286,
    monthlyRevenueArs: 4125000,
    conversionRate: 18.4,
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
  categories: [
    { id: "combos", name: "Combos", description: "Opciones completas para resolver rapido." },
    { id: "subs", name: "Subs", description: "Sandwiches calientes y frios." },
    { id: "wraps", name: "Wraps", description: "Versiones livianas para llevar." },
    { id: "bebidas", name: "Bebidas", description: "Refrescos y extras." },
  ],
  items: [
    {
      id: "combo-1",
      categoryId: "combos",
      name: "Combo Italian B.M.T.",
      description: "Sub de 15 cm, papas horneadas y bebida de 500 ml.",
      price: 12990,
      image:
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80",
      featured: true,
      available: true,
      prepTime: "12 min",
    },
    {
      id: "sub-1",
      categoryId: "subs",
      name: "Chicken Teriyaki",
      description: "Pollo glaseado, cebolla morada y salsa teriyaki.",
      price: 10990,
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
      featured: true,
      available: true,
      prepTime: "10 min",
    },
    {
      id: "sub-2",
      categoryId: "subs",
      name: "Veggie Delight",
      description: "Pepino, tomate, hojas verdes y aderezo suave.",
      price: 8890,
      image:
        "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80",
      featured: false,
      available: true,
      prepTime: "8 min",
    },
    {
      id: "wrap-1",
      categoryId: "wraps",
      name: "Wrap Caesar",
      description: "Pollo, parmesano, crocante y salsa Caesar.",
      price: 9990,
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
      featured: false,
      available: true,
      prepTime: "9 min",
    },
    {
      id: "drink-1",
      categoryId: "bebidas",
      name: "Limonada mint",
      description: "Botella individual, fria y lista para llevar.",
      price: 3400,
      image:
        "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
      featured: false,
      available: true,
      prepTime: "2 min",
    },
  ],
};

const sushiDemo: RestaurantRecord = {
  id: "rest-sushi-demo",
  name: "Nori Lab",
  slug: "nori-lab",
  subdomain: "nori-lab.menui.oi",
  dnsStatus: "pending",
  connectedToDemo: false,
  billingMode: "mercado_pago_subscription",
  city: "Cordoba",
  cuisine: "Sushi contemporaneo",
  description:
    "Carta pensada para take away y delivery nocturno con organizacion por combinados y piezas.",
  status: "trial",
  adminName: "Joaquin Ledesma",
  adminWhatsapp: "5493516677889",
  customerWhatsapp: "5493516677889",
  onboardingNote: "Restaurante en prueba de 14 dias antes de activar suscripcion automatica.",
  graceUntil: null,
  subscription: {
    planId: "pro",
    plan: "Menui Growth",
    amountArs: 39900,
    cycle: "monthly",
    mercadopagoPreapprovalId: "mp-preapproval-nori-002",
    collectionMethod: "automatic",
    status: "scheduled",
    renewsOn: "2026-05-21",
  },
  metrics: {
    monthlyOrders: 94,
    monthlyRevenueArs: 1874000,
    conversionRate: 11.1,
  },
  theme: {
    accent: "#ff6b35",
    accentSoft: "#ffd8cb",
    surface: "#fff8f3",
    surfaceAlt: "#f6eee8",
    border: "#2b1710",
    text: "#1d1411",
    muted: "#7a655d",
    heroGradient: "linear-gradient(180deg, #2b1710 0%, #5c2416 100%)",
  },
  categories: [
    { id: "boxes", name: "Boxes", description: "Combinados para compartir." },
    { id: "nigiris", name: "Nigiris", description: "Piezas premium a pedido." },
    { id: "temakis", name: "Temakis", description: "Conos frescos y rapidos." },
  ],
  items: [
    {
      id: "box-1",
      categoryId: "boxes",
      name: "Box 24 piezas",
      description: "Mix de rolls premium con salsa teriyaki aparte.",
      price: 24800,
      image:
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
      featured: true,
      available: true,
      prepTime: "18 min",
    },
    {
      id: "nigiri-1",
      categoryId: "nigiris",
      name: "Nigiri de salmon",
      description: "Corte fresco y arroz tibio de grano corto.",
      price: 11400,
      image:
        "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80",
      featured: false,
      available: true,
      prepTime: "11 min",
    },
    {
      id: "temaki-1",
      categoryId: "temakis",
      name: "Temaki spicy tuna",
      description: "Atun, palta y mayo picante en alga crocante.",
      price: 9200,
      image:
        "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=900&q=80",
      featured: false,
      available: false,
      prepTime: "14 min",
    },
  ],
};

export const platformSnapshot: PlatformSnapshot = {
  brandName: "Menui",
  domain: "menui.oi",
  monthlyPlanArs: 39900,
  mercadopagoNote:
    "Mercado Pago se modela como suscripcion automatica mediante preapproval mensual.",
  plans: planCatalog,
  restaurants: [subwayDemo, sushiDemo],
};

export const demoRestaurant = platformSnapshot.restaurants[0];

export const getRestaurantBySlug = (slug: string) =>
  platformSnapshot.restaurants.find((restaurant) => restaurant.slug === slug) ?? demoRestaurant;
