import { redirect } from "next/navigation";
import { getRestaurantSlugFromRequestHeaders } from "@/lib/subdomain-routing";

export default async function QrEntryPage() {
  const restaurantSlug = await getRestaurantSlugFromRequestHeaders();

  if (restaurantSlug) {
    redirect(`/qr/${restaurantSlug}`);
  }

  redirect("/");
}
