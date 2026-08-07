import { redirect } from "next/navigation";

type MarketplaceRestaurantOrderAliasPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MarketplaceRestaurantOrderAliasPage({
  params,
}: MarketplaceRestaurantOrderAliasPageProps) {
  const { slug } = await params;

  redirect(`/contenedores/${slug}/menu`);
}
