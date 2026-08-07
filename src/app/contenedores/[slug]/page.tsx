import { redirect } from "next/navigation";

type MarketplaceRestaurantPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MarketplaceRestaurantPage({
  params,
}: MarketplaceRestaurantPageProps) {
  const { slug } = await params;
  redirect(`/contenedores/${slug}/menu`);
}
