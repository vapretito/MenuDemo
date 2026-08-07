import { redirect } from "next/navigation";

type MarketplaceRestaurantLoginAliasPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function MarketplaceRestaurantLoginAliasPage({
  params,
}: MarketplaceRestaurantLoginAliasPageProps) {
  const { slug } = await params;

  redirect(`/restaurant/${slug}/login`);
}
