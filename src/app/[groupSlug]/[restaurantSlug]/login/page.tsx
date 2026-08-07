import { redirect } from "next/navigation";

type GroupRestaurantLoginAliasPageProps = {
  params: Promise<{
    restaurantSlug: string;
  }>;
};

export default async function GroupRestaurantLoginAliasPage({
  params,
}: GroupRestaurantLoginAliasPageProps) {
  const { restaurantSlug } = await params;

  redirect(`/restaurant/${restaurantSlug}/login`);
}
