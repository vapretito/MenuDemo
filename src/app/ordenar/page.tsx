import { redirect } from "next/navigation";
import { getRestaurantSlugFromRequestHeaders } from "@/lib/subdomain-routing";

export default async function LocalOrderingEntryPage() {
  const restaurantSlug = await getRestaurantSlugFromRequestHeaders();

  if (restaurantSlug) {
    redirect(`/ordenar/${restaurantSlug}`);
  }

  redirect("/");
}
