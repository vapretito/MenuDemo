import { NextResponse } from "next/server";
import {
  BillingMode,
  CollectionMethod,
  DnsStatus,
  RestaurantStatus,
  SubscriptionStatus,
  UserRole,
} from "@/generated/prisma/client";
import { createMercadoPagoPreapproval } from "@/lib/mercadopago";
import { generateTemporaryPassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const planCatalog: Record<
  string,
  {
    name: string;
    amountArs: number;
  }
> = {
  basic: {
    name: "Menui Basic",
    amountArs: 20000,
  },
  test_real: {
    name: "Menui Test Real",
    amountArs: 500,
  },
};

const reservedSlugs = new Set([
  "www",
  "api",
  "admin",
  "login",
  "backoffice",
  "superadmin",
  "activar",
  "contratar",
  "demo",
]);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizeWhatsapp = (value: string) => value.replace(/\D/g, "");

const getBaseUrl = () => {
  const baseUrl = process.env.MENUI_BASE_URL?.trim() ?? "https://menui.online";

  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    throw new Error(
      "MENUI_BASE_URL debe ser una URL completa. Ejemplo: https://menui.online"
    );
  }

  return baseUrl.replace(/\/$/, "");
};

const getRootDomain = () => process.env.MENUI_ROOT_DOMAIN ?? "menui.online";

const getTrialEndsAt = (planId: string) => {
  const trialEndsAt = new Date();

  if (planId === "test_real") {
    trialEndsAt.setMinutes(trialEndsAt.getMinutes() + 10);
    return trialEndsAt;
  }

  trialEndsAt.setDate(trialEndsAt.getDate() + 7);
  return trialEndsAt;
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Onboarding API activa.",
  });
}

export async function POST(request: Request) {
  let createdRestaurantId: string | null = null;

  try {
    const body = await request.json();

    const restaurantName = String(body.restaurantName ?? "").trim();
    const ownerName = String(body.ownerName ?? "").trim();
    const ownerEmail = String(body.ownerEmail ?? "").trim().toLowerCase();
    const whatsapp = normalizeWhatsapp(String(body.whatsapp ?? "").trim());
    const city = String(body.city ?? "").trim();
    const cuisine = String(body.cuisine ?? "").trim();
    const planId = String(body.planId ?? "basic").trim();
    const acceptedLegal = Boolean(body.acceptedLegal);

    const wantedSlug = String(body.slug ?? "").trim();
    const slug = slugify(wantedSlug || restaurantName);
    const selectedPlan = planCatalog[planId];

    if (!selectedPlan) {
      return NextResponse.json(
        {
          error: "Plan invalido. Elegi Menui Basic o Menui Test Real.",
        },
        { status: 400 }
      );
    }

    const subdomain = `${slug}.${getRootDomain()}`.toLowerCase();

    if (!restaurantName || !ownerName || !ownerEmail || !whatsapp || !city || !slug) {
      return NextResponse.json(
        {
          error:
            "Faltan datos obligatorios: restaurante, responsable, email, WhatsApp, ciudad o slug.",
        },
        { status: 400 }
      );
    }

    if (!ownerEmail.includes("@")) {
      return NextResponse.json(
        { error: "El email del responsable no parece valido." },
        { status: 400 }
      );
    }

    if (whatsapp.length < 10 || whatsapp.length > 15) {
      return NextResponse.json(
        {
          error:
            "El WhatsApp del local debe tener entre 10 y 15 digitos y corresponder al numero real del delivery.",
        },
        { status: 400 }
      );
    }

    if (!acceptedLegal) {
      return NextResponse.json(
        {
          error:
            "Tenes que aceptar los terminos y la politica de privacidad para continuar.",
        },
        { status: 400 }
      );
    }

    if (reservedSlugs.has(slug)) {
      return NextResponse.json(
        {
          error:
            "Ese slug esta reservado por Menui. Proba con otro nombre para el restaurante.",
        },
        { status: 400 }
      );
    }

    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [{ slug }, { subdomain }],
      },
      select: {
        id: true,
      },
    });

    if (existingRestaurant) {
      return NextResponse.json(
        {
          error: "Ese slug o subdominio ya esta ocupado. Proba con otro nombre.",
        },
        { status: 409 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: ownerEmail,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Ese email ya esta registrado. Usa otro email o gestiona el alta desde backoffice.",
        },
        { status: 409 }
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = hashPassword(temporaryPassword);
    const trialEndsAt = getTrialEndsAt(planId);

    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        slug,
        subdomain,
        city,
        cuisine: cuisine || "Gastronomia",
        description:
          "Restaurante creado desde el alta automatica de Menui. Pendiente de activacion por pago.",
        status: RestaurantStatus.TRIAL,
        trialEndsAt,
        dnsStatus: DnsStatus.CONFIGURED,
        billingMode: BillingMode.MERCADO_PAGO_SUBSCRIPTION,
        connectedToDemo: false,
        adminName: ownerName,
        adminWhatsapp: whatsapp,
        customerWhatsapp: whatsapp,
        onboardingNote:
          "Alta automatica creada desde la landing. Pendiente de completar pago de membresia.",
        users: {
          create: {
            name: ownerName,
            email: ownerEmail,
            passwordHash,
            role: UserRole.RESTAURANT_ADMIN,
          },
        },
        subscription: {
          create: {
            planId,
            planName: selectedPlan.name,
            amountArs: selectedPlan.amountArs,
            cycle: "monthly",
            collectionMethod: CollectionMethod.AUTOMATIC,
            status: SubscriptionStatus.SCHEDULED,
            renewsOn: trialEndsAt,
          },
        },
        categories: {
          create: [
            {
              name: "Destacados",
              description: "Productos principales del menu.",
              sortOrder: 0,
            },
          ],
        },
      },
      include: {
        subscription: true,
      },
    });

    createdRestaurantId = restaurant.id;

    const mercadoPagoSubscription = await createMercadoPagoPreapproval({
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.name,
      planName: selectedPlan.name,
      amountArs: selectedPlan.amountArs,
      payerEmail: ownerEmail,
      trialEndsAt,
    });

    const checkoutUrl = mercadoPagoSubscription.initPoint;

    if (!checkoutUrl) {
      throw new Error("Mercado Pago no devolvio link de pago.");
    }

    await prisma.subscription.update({
      where: {
        restaurantId: restaurant.id,
      },
      data: {
        mercadopagoPreapprovalId: mercadoPagoSubscription.id,
        mercadopagoInitPoint: checkoutUrl,
        mercadopagoPayerEmail: ownerEmail,
        status: SubscriptionStatus.SCHEDULED,
        renewsOn: trialEndsAt,
      },
    });

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        subdomain: restaurant.subdomain,
        status: restaurant.status,
        trialEndsAt,
      },
      paymentUrl: `${getBaseUrl()}/activar/${restaurant.slug}`,
      checkoutUrl,
      adminUrl: `https://${restaurant.subdomain}/admin`,
      loginUrl: `https://${restaurant.subdomain}/login`,
      credentials: {
        email: ownerEmail,
        temporaryPassword,
      },
    });
  } catch (error) {
    if (createdRestaurantId) {
      await prisma.user.deleteMany({
        where: {
          restaurantId: createdRestaurantId,
        },
      });

      await prisma.restaurant.delete({
        where: {
          id: createdRestaurantId,
        },
      });
    }

    console.error("[Public Onboarding Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo completar el alta automatica.",
      },
      { status: 500 }
    );
  }
}
