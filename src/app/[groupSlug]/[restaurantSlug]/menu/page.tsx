import { notFound } from "next/navigation";
import { LocalOrderingMenu } from "@/components/local-ordering-menu";
import { getPublicRestaurantInGroup } from "@/lib/restaurant-groups";

type GroupRestaurantMenuPageProps = {
  params: Promise<{
    groupSlug: string;
    restaurantSlug: string;
  }>;
};

export default async function GroupRestaurantMenuPage({
  params,
}: GroupRestaurantMenuPageProps) {
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
        orderSuccessPathBuilder={(slug, orderId) =>
          `/${groupSlug}/${slug}/pedido/${orderId}`
        }
        homeHref={`/${groupSlug}`}
        homeLabel={`Volver a ${restaurant.groupName ?? "grupo"}`}
        homeBrandSrc={null}
      />
    </main>
  );
}
