import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OrderConfirmationView } from "@/components/order-confirmation-view";
import { prisma } from "@/lib/prisma";
import { canRestaurantAccessPanel } from "@/lib/restaurant-access";

type OrderConfirmationPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Pedido listo | Menui",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug,
    },
    include: {
      subscription: true,
    },
  });

  if (!restaurant) {
    notFound();
  }

  if (!canRestaurantAccessPanel(restaurant)) {
    redirect(`/activar/${restaurant.slug}`);
  }

  return (
    <OrderConfirmationView restaurantName={restaurant.name} slug={restaurant.slug} />
  );
}
