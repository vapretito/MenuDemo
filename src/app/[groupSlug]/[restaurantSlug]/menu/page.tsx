import { redirect } from "next/navigation";

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
  redirect(`/${groupSlug}/${restaurantSlug}/menu/ordenar`);
}
