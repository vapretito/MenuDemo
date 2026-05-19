import { RestaurantStatus } from "@/generated/prisma/client";

type RestaurantAccessInput = {
  slug: string;
  status: RestaurantStatus;
  trialEndsAt?: Date | null;
  graceUntil?: Date | null;
};

export function canRestaurantAccessPanel(restaurant: RestaurantAccessInput) {
  if (restaurant.slug === "demo") return true;

  if (
    restaurant.status === RestaurantStatus.ACTIVE ||
    restaurant.status === RestaurantStatus.MANUAL
  ) {
    return true;
  }

  if (restaurant.status === RestaurantStatus.TRIAL) {
    if (!restaurant.trialEndsAt) return false;

    return restaurant.trialEndsAt.getTime() > Date.now();
  }

  if (restaurant.status === RestaurantStatus.PAST_DUE) {
    if (!restaurant.graceUntil) return false;

    return restaurant.graceUntil.getTime() > Date.now();
  }

  return false;
}