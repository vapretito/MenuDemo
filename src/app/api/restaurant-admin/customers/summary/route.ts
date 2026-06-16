import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRestaurantSession } from "@/lib/restaurant-session";

const NEW_CUSTOMER_DAYS = 30;
const INACTIVE_DAYS = 30;
const FREQUENT_ORDER_THRESHOLD = 3;

type CustomerFilter = "all" | "new" | "frequent" | "inactive30";

const isCustomerFilter = (value: string): value is CustomerFilter =>
  value === "all" ||
  value === "new" ||
  value === "frequent" ||
  value === "inactive30";

export async function GET(request: NextRequest) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const requestedFilter = request.nextUrl.searchParams.get("filter") ?? "all";
  const filter: CustomerFilter = isCustomerFilter(requestedFilter)
    ? requestedFilter
    : "all";

  const now = new Date();
  const newThreshold = new Date(now);
  newThreshold.setDate(newThreshold.getDate() - NEW_CUSTOMER_DAYS);

  const inactiveThreshold = new Date(now);
  inactiveThreshold.setDate(inactiveThreshold.getDate() - INACTIVE_DAYS);

  try {
    const [customers, totals] = await prisma.$transaction([
      prisma.customer.findMany({
        where: {
          restaurantId: session.restaurantId,
          ...(filter === "new"
            ? {
                firstOrderAt: {
                  gte: newThreshold,
                },
              }
            : {}),
          ...(filter === "frequent"
            ? {
                orderCount: {
                  gte: FREQUENT_ORDER_THRESHOLD,
                },
              }
            : {}),
          ...(filter === "inactive30"
            ? {
                lastOrderAt: {
                  lte: inactiveThreshold,
                },
              }
            : {}),
        },
        orderBy: [
          {
            lastOrderAt: "desc",
          },
          {
            totalSpentArs: "desc",
          },
        ],
        take: 120,
      }),
      prisma.customer.aggregate({
        where: {
          restaurantId: session.restaurantId,
        },
        _sum: {
          totalSpentArs: true,
        },
      }),
    ]);

    const [totalCustomers, newCustomers, frequentCustomers, inactiveCustomers, consentedCustomers] =
      await prisma.$transaction([
        prisma.customer.count({
          where: {
            restaurantId: session.restaurantId,
          },
        }),
        prisma.customer.count({
          where: {
            restaurantId: session.restaurantId,
            firstOrderAt: {
              gte: newThreshold,
            },
          },
        }),
        prisma.customer.count({
          where: {
            restaurantId: session.restaurantId,
            orderCount: {
              gte: FREQUENT_ORDER_THRESHOLD,
            },
          },
        }),
        prisma.customer.count({
          where: {
            restaurantId: session.restaurantId,
            lastOrderAt: {
              lte: inactiveThreshold,
            },
          },
        }),
        prisma.customer.count({
          where: {
            restaurantId: session.restaurantId,
            marketingConsent: true,
          },
        }),
      ]);

    return NextResponse.json({
      ok: true,
      summary: {
        filter,
        totalCustomers,
        newCustomers,
        frequentCustomers,
        inactiveCustomers,
        consentedCustomers,
        totalRevenueArs: totals._sum.totalSpentArs ?? 0,
        customers: customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          whatsapp: customer.whatsapp,
          marketingConsent: customer.marketingConsent,
          source: customer.source,
          firstOrderAt: customer.firstOrderAt,
          lastOrderAt: customer.lastOrderAt,
          lastOrderTotalArs: customer.lastOrderTotalArs,
          orderCount: customer.orderCount,
          totalSpentArs: customer.totalSpentArs,
          createdAt: customer.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[Customer Summary Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el resumen de clientes.",
      },
      { status: 500 }
    );
  }
}
