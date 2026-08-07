import { RestaurantAccessMode, RestaurantStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canRestaurantAccessPanel } from "@/lib/restaurant-access";
import { mapRestaurantToRecord } from "@/lib/restaurant-mapper";
import type { RestaurantGroupRecord } from "@/types/platform";

const restaurantInclude = {
  categories: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  products: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  subscription: true,
  group: true,
};

const publicRestaurantFilter = {
  status: {
    in: <RestaurantStatus[]>[
      RestaurantStatus.ACTIVE,
      RestaurantStatus.TRIAL,
      RestaurantStatus.MANUAL,
      RestaurantStatus.PAST_DUE,
    ],
  },
  localOrderingEnabled: true,
  products: {
    some: {},
  },
} as const;

export function mapRestaurantGroupRecord(group: {
  id: string;
  name: string;
  slug: string;
  description: string;
  accentColor: string;
  isActive: boolean;
  _count?: {
    restaurants?: number;
  };
}): RestaurantGroupRecord {
  return {
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    accentColor: group.accentColor,
    isActive: group.isActive,
    restaurantsCount: group._count?.restaurants ?? 0,
  };
}

export async function getRestaurantGroups() {
  const groups = await prisma.restaurantGroup.findMany({
    orderBy: {
      createdAt: "asc",
    },
    include: {
      _count: {
        select: {
          restaurants: true,
        },
      },
    },
  });

  return groups.map(mapRestaurantGroupRecord);
}

export async function getPublicRestaurantGroupBySlug(groupSlug: string) {
  return prisma.restaurantGroup.findFirst({
    where: {
      slug: groupSlug,
      isActive: true,
    },
    include: {
      restaurants: {
        where: {
          ...publicRestaurantFilter,
          accessMode: RestaurantAccessMode.CONTAINER_PATH,
        },
        include: restaurantInclude,
        orderBy: [{ connectedToDemo: "desc" }, { name: "asc" }],
      },
    },
  });
}

export async function getPublicRestaurantsForGroup(groupSlug: string) {
  const group = await getPublicRestaurantGroupBySlug(groupSlug);

  if (!group) {
    return null;
  }

  const restaurants = group.restaurants
    .filter((restaurant) => canRestaurantAccessPanel(restaurant))
    .map((restaurant) => mapRestaurantToRecord(restaurant));

  return {
    group: mapRestaurantGroupRecord(group),
    restaurants,
  };
}

export async function getPublicRestaurantInGroup(
  groupSlug: string,
  restaurantSlug: string
) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      slug: restaurantSlug,
      accessMode: RestaurantAccessMode.CONTAINER_PATH,
      group: {
        slug: groupSlug,
        isActive: true,
      },
      ...publicRestaurantFilter,
    },
    include: restaurantInclude,
  });

  if (!restaurant || !canRestaurantAccessPanel(restaurant)) {
    return null;
  }

  const record = mapRestaurantToRecord(restaurant);
  const visibleCategoryIds = new Set(
    record.categories
      .filter((category) => !category.hidden)
      .map((category) => category.id)
  );

  return {
    ...record,
    categories: record.categories.filter((category) =>
      visibleCategoryIds.has(category.id)
    ),
    items: record.items.filter((item) => visibleCategoryIds.has(item.categoryId)),
  };
}
