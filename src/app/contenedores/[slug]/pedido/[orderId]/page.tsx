import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LocalOrderStatusClient } from "@/app/ordenar/[slug]/pedido/[orderId]/local-order-status-client";

type MarketplaceOrderStatusPageProps = {
  params: Promise<{
    slug: string;
    orderId: string;
  }>;
};

export default async function MarketplaceOrderStatusPage({
  params,
}: MarketplaceOrderStatusPageProps) {
  const { slug, orderId } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurant: {
        slug,
        group: {
          slug: "contenedores",
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
      repeatOrderHref={`/contenedores/${slug}/menu`}
      menuHref="/contenedores"
      eyebrowLabel="Pedido desde Contenedores"
      statusPageHref={`/contenedores/${slug}/pedido/${orderId}`}
    />
  );
}
