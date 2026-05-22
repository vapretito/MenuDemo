import { redirect } from "next/navigation";
import { getRestaurantSlugFromRequestHeaders } from "@/lib/subdomain-routing";

export default async function LoginPage() {
  const restaurantSlug = await getRestaurantSlugFromRequestHeaders();

  if (restaurantSlug) {
    redirect(`/restaurant/${restaurantSlug}/login`);
  }

  redirect("/backoffice/login");
}
