import { redirect } from "next/navigation";

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

  redirect(`/${groupSlug}/${restaurantSlug}/menu`);
}
