import { notFound, redirect } from "next/navigation";
import { RestaurantAdminPanel } from "@/components/restaurant-admin-panel";
import { getRestaurantSession } from "@/lib/restaurant-session";
import { prisma } from "@/lib/prisma";
import { mapRestaurantToRecord } from "@/lib/restaurant-mapper";

type RestaurantAdminPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RestaurantAdminPage({
  params,
}: RestaurantAdminPageProps) {
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

  if (restaurant.status !== "ACTIVE" && restaurant.slug !== "demo") {
    redirect(`/activar/${restaurant.slug}`);
  }

  const session = await getRestaurantSession();

  if (
    restaurant.slug !== "demo" &&
    (!session ||
      session.restaurantId !== restaurant.id ||
      session.restaurantSlug !== restaurant.slug)
  ) {
    redirect("/login");
  }

  return (
    <RestaurantAdminPanel
      restaurantSlug={slug}
      initialRestaurant={mapRestaurantToRecord(restaurant)}
    />
  );
}