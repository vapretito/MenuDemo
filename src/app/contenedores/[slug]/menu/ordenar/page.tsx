import { notFound } from "next/navigation";
import { LocalOrderingMenu } from "@/components/local-ordering-menu";
import { getPublicRestaurantInGroup } from "@/lib/restaurant-groups";

type MarketplaceRestaurantOrderPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MarketplaceRestaurantOrderPage({
  params,
}: MarketplaceRestaurantOrderPageProps) {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantInGroup("contenedores", slug);

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="menuPage">
      <LocalOrderingMenu
        restaurant={restaurant}
        orderApiPath="/api/contenedores/orders"
        orderSuccessPathPrefix="/contenedores"
        homeHref="/contenedores"
        homeLabel="Volver a Contenedores"
        homeBrandSrc={null}
      />
    </main>
  );
}
