import "dotenv/config";
import {
    BillingMode,
    CollectionMethod,
    DnsStatus,
    PrismaClient,
    RestaurantStatus,
    SubscriptionStatus,
    UserRole,
  } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta DATABASE_URL_UNPOOLED o DATABASE_URL en .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

const restaurants = [
  {
    id: "rest-subway-demo",
    name: "Subway Central",
    slug: "subway",
    subdomain: "subway.menui.oi",
    dnsStatus: DnsStatus.CONFIGURED,
    connectedToDemo: true,
    billingMode: BillingMode.MERCADO_PAGO_SUBSCRIPTION,
    city: "Buenos Aires",
    cuisine: "Sandwiches y wraps",
    description:
      "Menu digital para delivery con foco en compra rapida, personalizacion visual y pedido directo a WhatsApp.",
    status: RestaurantStatus.ACTIVE,
    adminName: "Lucia Ferreyra",
    adminWhatsapp: "5491133345566",
    customerWhatsapp: "5491133345566",
    onboardingNote:
      "Sucursal piloto para validar menu mobile, carrito y derivacion de pedidos por WhatsApp.",
    graceUntil: new Date("2026-06-08"),
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
    subscription: {
      planId: "pro",
      planName: "Menui Growth",
      amountArs: 39900,
      cycle: "monthly",
      mercadopagoPreapprovalId: "mp-preapproval-subway-001",
      collectionMethod: CollectionMethod.AUTOMATIC,
      status: SubscriptionStatus.ACTIVE,
      renewsOn: new Date("2026-06-03"),
    },
    categories: [
      {
        key: "combos",
        name: "Combos",
        description: "Opciones completas para resolver rapido.",
      },
      {
        key: "subs",
        name: "Subs",
        description: "Sandwiches calientes y frios.",
      },
      {
        key: "wraps",
        name: "Wraps",
        description: "Versiones livianas para llevar.",
      },
      {
        key: "bebidas",
        name: "Bebidas",
        description: "Refrescos y extras.",
      },
    ],
    items: [
      {
        categoryKey: "combos",
        name: "Combo Italian B.M.T.",
        description: "Sub de 15 cm, papas horneadas y bebida de 500 ml.",
        priceArs: 12990,
        image:
          "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80",
        featured: true,
        available: true,
        prepTime: "12 min",
      },
      {
        categoryKey: "subs",
        name: "Chicken Teriyaki",
        description: "Pollo glaseado, cebolla morada y salsa teriyaki.",
        priceArs: 10990,
        image:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
        featured: true,
        available: true,
        prepTime: "10 min",
      },
      {
        categoryKey: "subs",
        name: "Veggie Delight",
        description: "Pepino, tomate, hojas verdes y aderezo suave.",
        priceArs: 8890,
        image:
          "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80",
        featured: false,
        available: true,
        prepTime: "8 min",
      },
      {
        categoryKey: "wraps",
        name: "Wrap Caesar",
        description: "Pollo, parmesano, crocante y salsa Caesar.",
        priceArs: 9990,
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
        featured: false,
        available: true,
        prepTime: "9 min",
      },
      {
        categoryKey: "bebidas",
        name: "Limonada mint",
        description: "Botella individual, fria y lista para llevar.",
        priceArs: 3400,
        image:
          "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80",
        featured: false,
        available: true,
        prepTime: "2 min",
      },
    ],
  },
  {
    id: "rest-sushi-demo",
    name: "Nori Lab",
    slug: "nori-lab",
    subdomain: "nori-lab.menui.oi",
    dnsStatus: DnsStatus.PENDING,
    connectedToDemo: false,
    billingMode: BillingMode.MERCADO_PAGO_SUBSCRIPTION,
    city: "Cordoba",
    cuisine: "Sushi contemporaneo",
    description:
      "Carta pensada para take away y delivery nocturno con organizacion por combinados y piezas.",
    status: RestaurantStatus.TRIAL,
    adminName: "Joaquin Ledesma",
    adminWhatsapp: "5493516677889",
    customerWhatsapp: "5493516677889",
    onboardingNote: "Restaurante en prueba de 14 dias antes de activar suscripcion automatica.",
    graceUntil: null,
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
    subscription: {
      planId: "pro",
      planName: "Menui Growth",
      amountArs: 39900,
      cycle: "monthly",
      mercadopagoPreapprovalId: "mp-preapproval-nori-002",
      collectionMethod: CollectionMethod.AUTOMATIC,
      status: SubscriptionStatus.SCHEDULED,
      renewsOn: new Date("2026-05-21"),
    },
    categories: [
      {
        key: "boxes",
        name: "Boxes",
        description: "Combinados para compartir.",
      },
      {
        key: "nigiris",
        name: "Nigiris",
        description: "Piezas premium a pedido.",
      },
      {
        key: "temakis",
        name: "Temakis",
        description: "Conos frescos y rapidos.",
      },
    ],
    items: [
      {
        categoryKey: "boxes",
        name: "Box 24 piezas",
        description: "Mix de rolls premium con salsa teriyaki aparte.",
        priceArs: 24800,
        image:
          "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
        featured: true,
        available: true,
        prepTime: "18 min",
      },
      {
        categoryKey: "nigiris",
        name: "Nigiri de salmon",
        description: "Corte fresco y arroz tibio de grano corto.",
        priceArs: 11400,
        image:
          "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80",
        featured: false,
        available: true,
        prepTime: "11 min",
      },
      {
        categoryKey: "temakis",
        name: "Temaki spicy tuna",
        description: "Atun, palta y mayo picante en alga crocante.",
        priceArs: 9200,
        image:
          "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=900&q=80",
        featured: false,
        available: false,
        prepTime: "14 min",
      },
    ],
  },
];

async function seedSuperAdmin() {
  await prisma.user.upsert({
    where: {
      email: "admin@menui.oi",
    },
    update: {
      name: "Menui Superadmin",
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      name: "Menui Superadmin",
      email: "admin@menui.oi",
      role: UserRole.SUPER_ADMIN,
    },
  });
}

async function seedRestaurant(seed: (typeof restaurants)[number]) {
  const restaurant = await prisma.restaurant.upsert({
    where: {
      slug: seed.slug,
    },
    update: {
      name: seed.name,
      subdomain: seed.subdomain,
      dnsStatus: seed.dnsStatus,
      connectedToDemo: seed.connectedToDemo,
      billingMode: seed.billingMode,
      city: seed.city,
      cuisine: seed.cuisine,
      description: seed.description,
      status: seed.status,
      adminName: seed.adminName,
      adminWhatsapp: seed.adminWhatsapp,
      customerWhatsapp: seed.customerWhatsapp,
      onboardingNote: seed.onboardingNote,
      graceUntil: seed.graceUntil,
      accent: seed.theme.accent,
      accentSoft: seed.theme.accentSoft,
      surface: seed.theme.surface,
      surfaceAlt: seed.theme.surfaceAlt,
      border: seed.theme.border,
      text: seed.theme.text,
      muted: seed.theme.muted,
      heroGradient: seed.theme.heroGradient,
    },
    create: {
      id: seed.id,
      name: seed.name,
      slug: seed.slug,
      subdomain: seed.subdomain,
      dnsStatus: seed.dnsStatus,
      connectedToDemo: seed.connectedToDemo,
      billingMode: seed.billingMode,
      city: seed.city,
      cuisine: seed.cuisine,
      description: seed.description,
      status: seed.status,
      adminName: seed.adminName,
      adminWhatsapp: seed.adminWhatsapp,
      customerWhatsapp: seed.customerWhatsapp,
      onboardingNote: seed.onboardingNote,
      graceUntil: seed.graceUntil,
      accent: seed.theme.accent,
      accentSoft: seed.theme.accentSoft,
      surface: seed.theme.surface,
      surfaceAlt: seed.theme.surfaceAlt,
      border: seed.theme.border,
      text: seed.theme.text,
      muted: seed.theme.muted,
      heroGradient: seed.theme.heroGradient,
    },
  });

  await prisma.subscription.upsert({
    where: {
      restaurantId: restaurant.id,
    },
    update: {
      planId: seed.subscription.planId,
      planName: seed.subscription.planName,
      amountArs: seed.subscription.amountArs,
      cycle: seed.subscription.cycle,
      mercadopagoPreapprovalId: seed.subscription.mercadopagoPreapprovalId,
      collectionMethod: seed.subscription.collectionMethod,
      status: seed.subscription.status,
      renewsOn: seed.subscription.renewsOn,
    },
    create: {
      restaurantId: restaurant.id,
      planId: seed.subscription.planId,
      planName: seed.subscription.planName,
      amountArs: seed.subscription.amountArs,
      cycle: seed.subscription.cycle,
      mercadopagoPreapprovalId: seed.subscription.mercadopagoPreapprovalId,
      collectionMethod: seed.subscription.collectionMethod,
      status: seed.subscription.status,
      renewsOn: seed.subscription.renewsOn,
    },
  });

  await prisma.product.deleteMany({
    where: {
      restaurantId: restaurant.id,
    },
  });

  await prisma.category.deleteMany({
    where: {
      restaurantId: restaurant.id,
    },
  });

  const categoryMap = new Map<string, string>();

  for (const [index, category] of seed.categories.entries()) {
    const createdCategory = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        name: category.name,
        description: category.description,
        sortOrder: index,
      },
    });

    categoryMap.set(category.key, createdCategory.id);
  }

  await prisma.product.createMany({
    data: seed.items.map((item, index) => {
      const categoryId = categoryMap.get(item.categoryKey);

      if (!categoryId) {
        throw new Error(`No se encontró categoría para ${item.name}`);
      }

      return {
        restaurantId: restaurant.id,
        categoryId,
        name: item.name,
        description: item.description,
        priceArs: item.priceArs,
        image: item.image,
        featured: item.featured,
        available: item.available,
        prepTime: item.prepTime,
        sortOrder: index,
      };
    }),
  });

  console.log(`Seeded restaurant: ${restaurant.name}`);
}

async function main() {
  await seedSuperAdmin();

  for (const restaurant of restaurants) {
    await seedRestaurant(restaurant);
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });