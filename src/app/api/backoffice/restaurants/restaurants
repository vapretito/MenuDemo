import { NextResponse } from "next/server";
import {
  BillingMode,
  CollectionMethod,
  DnsStatus,
  RestaurantStatus,
  SubscriptionStatus,
} from "../../../../generated/prisma/client";
import { isBackofficeAuthenticated } from "../../../../lib/backoffice-auth";
import { prisma } from "../../../../lib/prisma";
import { mapRestaurantToRecord } from "../../../../lib/restaurant-mapper";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getRootDomain = () => process.env.MENUI_ROOT_DOMAIN ?? "menui.online";

const statusMap: Record<string, RestaurantStatus> = {
  trial: RestaurantStatus.TRIAL,
  active: RestaurantStatus.ACTIVE,
  past_due: RestaurantStatus.PAST_DUE,
  suspended: RestaurantStatus.SUSPENDED,
  cancelled: RestaurantStatus.CANCELLED,
  manual: RestaurantStatus.MANUAL,
};

const billingModeMap: Record<string, BillingMode> = {
  mercado_pago_subscription: BillingMode.MERCADO_PAGO_SUBSCRIPTION,
  manual: BillingMode.MANUAL,
};

const planPrices: Record<string, { name: string; price: number }> = {
  basic: {
    name: "Menui Basic",
    price: 19900,
  },
  pro: {
    name: "Menui Growth",
    price: 39900,
  },
  premium: {
    name: "Menui Premium",
    price: 69900,
  },
  demo: {
    name: "Menui Demo",
    price: 0,
  },
};

export async function GET() {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      categories: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      products: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      subscription: true,
    },
  });

  return NextResponse.json({
    restaurants: restaurants.map(mapRestaurantToRecord),
  });
}

export async function POST(request: Request) {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const rawSlug = String(body.slug ?? "").trim();
    const city = String(body.city ?? "").trim();
    const cuisine = String(body.cuisine ?? "").trim();
    const adminName = String(body.adminName ?? "").trim();
    const customerWhatsapp = String(body.customerWhatsapp ?? "").trim();
    const planId = String(body.planId ?? "basic").trim();
    const rawStatus = String(body.status ?? "trial").trim();
    const rawBillingMode = String(
      body.billingMode ?? "mercado_pago_subscription"
    ).trim();

    const slug = slugify(rawSlug || name);
    const subdomain =
      String(body.subdomain ?? "").trim() || `${slug}.${getRootDomain()}`;

    if (!name || !slug || !city || !customerWhatsapp) {
      return NextResponse.json(
        {
          error:
            "Faltan datos obligatorios: nombre, slug, ciudad o WhatsApp.",
        },
        { status: 400 }
      );
    }

    const selectedPlan = planPrices[planId] ?? planPrices.basic;
    const billingMode = billingModeMap[rawBillingMode] ?? BillingMode.MERCADO_PAGO_SUBSCRIPTION;
    const status = statusMap[rawStatus] ?? RestaurantStatus.TRIAL;
    const isManual = billingMode === BillingMode.MANUAL;

    const exists = await prisma.restaurant.findFirst({
      where: {
        OR: [{ slug }, { subdomain }],
      },
      select: {
        id: true,
      },
    });

    if (exists) {
      return NextResponse.json(
        {
          error: "Ya existe un restaurante con ese slug o subdominio.",
        },
        { status: 409 }
      );
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        subdomain,
        city,
        cuisine: cuisine || "Gastronomía",
        description:
          "Restaurante creado desde Menui Backoffice. Listo para configurar productos, categorías y WhatsApp.",
        status,
        dnsStatus: DnsStatus.CONFIGURED,
        billingMode,
        connectedToDemo: slug === "demo",
        adminName,
        adminWhatsapp: customerWhatsapp,
        customerWhatsapp,
        onboardingNote: isManual
          ? "Cliente creado con modalidad de cobro manual."
          : "Cliente creado desde backoffice. Pendiente de completar configuración comercial.",
        subscription: {
          create: {
            planId,
            planName: selectedPlan.name,
            amountArs: selectedPlan.price,
            cycle: "monthly",
            mercadopagoPreapprovalId: isManual ? "manual" : null,
            collectionMethod: isManual
              ? CollectionMethod.MANUAL
              : CollectionMethod.AUTOMATIC,
            status:
              status === RestaurantStatus.ACTIVE
                ? SubscriptionStatus.ACTIVE
                : SubscriptionStatus.SCHEDULED,
            renewsOn: null,
          },
        },
        categories: {
          create: [
            {
              name: "Destacados",
              description: "Productos principales del menú.",
              sortOrder: 0,
            },
          ],
        },
      },
      include: {
        categories: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        products: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        subscription: true,
      },
    });

    return NextResponse.json({
      restaurant: mapRestaurantToRecord(restaurant),
    });
  } catch (error) {
    console.error("[Backoffice Create Restaurant Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear el restaurante.",
      },
      { status: 500 }
    );
  }
}