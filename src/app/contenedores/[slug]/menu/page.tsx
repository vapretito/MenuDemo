import { redirect } from "next/navigation";

type MarketplaceRestaurantMenuPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MarketplaceRestaurantMenuPage({
  params,
}: MarketplaceRestaurantMenuPageProps) {
  const { slug } = await params;
  redirect(`/contenedores/${slug}/menu/ordenar`);
}
