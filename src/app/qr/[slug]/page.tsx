import { notFound, redirect } from "next/navigation";
import { MobileMenu } from "@/components/mobile-menu";
import { prisma } from "@/lib/prisma";
import { mapRestaurantToRecord } from "@/lib/restaurant-mapper";
import { canRestaurantAccessPanel } from "@/lib/restaurant-access";

type QrMenuPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function QrMenuPage({ params }: QrMenuPageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug,
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

  if (!restaurant) {
    notFound();
  }

  if (!canRestaurantAccessPanel(restaurant)) {
    redirect(`/activar/${restaurant.slug}`);
  }

  return (
    <main className="menuPage">
      <MobileMenu restaurant={mapRestaurantToRecord(restaurant)} mode="visual" />
    </main>
  );
}
