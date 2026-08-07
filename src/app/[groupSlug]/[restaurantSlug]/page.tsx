import { redirect } from "next/navigation";

type GroupRestaurantPageProps = {
  params: Promise<{
    groupSlug: string;
    restaurantSlug: string;
  }>;
};

export default async function GroupRestaurantPage({
  params,
}: GroupRestaurantPageProps) {
  const { groupSlug, restaurantSlug } = await params;

  redirect(`/${groupSlug}/${restaurantSlug}/menu`);
}
