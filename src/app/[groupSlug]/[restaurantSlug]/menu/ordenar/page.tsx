import { notFound } from "next/navigation";
import { LocalOrderingMenu } from "@/components/local-ordering-menu";
import { getPublicRestaurantInGroup } from "@/lib/restaurant-groups";

type GroupRestaurantOrderAliasPageProps = {
  params: Promise<{
    groupSlug: string;
    restaurantSlug: string;
  }>;
};

export default async function GroupRestaurantOrderAliasPage({
  params,
}: GroupRestaurantOrderAliasPageProps) {
  const { groupSlug, restaurantSlug } = await params;
  const restaurant = await getPublicRestaurantInGroup(groupSlug, restaurantSlug);

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="menuPage">
      <LocalOrderingMenu
        restaurant={restaurant}
        orderApiPath="/api/contenedores/orders"
        orderSuccessPathPrefix={`/${groupSlug}`}
        homeHref={`/${groupSlug}`}
        homeLabel={`Volver a ${restaurant.groupName ?? "grupo"}`}
        homeBrandSrc={null}
      />
    </main>
  );
}
