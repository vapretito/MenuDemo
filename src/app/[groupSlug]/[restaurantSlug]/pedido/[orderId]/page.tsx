import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LocalOrderStatusClient } from "@/app/ordenar/[slug]/pedido/[orderId]/local-order-status-client";

type GroupRestaurantOrderStatusPageProps = {
  params: Promise<{
    groupSlug: string;
    restaurantSlug: string;
    orderId: string;
  }>;
};

export default async function GroupRestaurantOrderStatusPage({
  params,
}: GroupRestaurantOrderStatusPageProps) {
  const { groupSlug, restaurantSlug, orderId } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurant: {
        slug: restaurantSlug,
        group: {
          slug: groupSlug,
        },
      },
    },
    include: {
      restaurant: {
        select: {
          name: true,
          slug: true,
        },
      },
      serviceLocation: {
        select: {
          name: true,
        },
      },
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <LocalOrderStatusClient
      initialOrder={{
        id: order.id,
        customerName: order.customerName,
        pickupCode: order.pickupCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalArs: order.totalArs,
        createdAt: order.createdAt.toISOString(),
        confirmedAt: order.confirmedAt?.toISOString() ?? null,
        paidAt: order.paidAt?.toISOString() ?? null,
        updatedAt: order.updatedAt.toISOString(),
        restaurant: {
          name: order.restaurant.name,
          slug: order.restaurant.slug,
        },
        serviceLocationName: order.serviceLocation?.name ?? null,
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          subtotalArs: item.subtotalArs,
          notes: item.notes,
        })),
      }}
      repeatOrderHref={`/${groupSlug}/${restaurantSlug}/menu`}
      menuHref={`/${groupSlug}`}
      eyebrowLabel="Pedido desde grupo Menui"
      statusPageHref={`/${groupSlug}/${restaurantSlug}/pedido/${orderId}`}
    />
  );
}
