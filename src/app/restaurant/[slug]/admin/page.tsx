import { RestaurantAdminPanel } from "@/components/restaurant-admin-panel";

type RestaurantAdminPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RestaurantAdminPage({
  params,
}: RestaurantAdminPageProps) {
  const { slug } = await params;

  return <RestaurantAdminPanel restaurantSlug={slug} />;
}