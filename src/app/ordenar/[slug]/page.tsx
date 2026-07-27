import { notFound, redirect } from "next/navigation";
import { LocalOrderingMenu } from "@/components/local-ordering-menu";
import { prisma } from "@/lib/prisma";
import { mapRestaurantToRecord } from "@/lib/restaurant-mapper";
import { canRestaurantAccessPanel } from "@/lib/restaurant-access";

type LocalOrderPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LocalOrderPage({
  params,
}: LocalOrderPageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug,
    },
    include: {
      categories: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      products: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      subscription: true,
    },
  });

  if (!restaurant) {
    notFound();
  }

  if (!canRestaurantAccessPanel(restaurant)) {
    redirect(`/activar/${restaurant.slug}`);
  }

  const record = mapRestaurantToRecord(restaurant);
  const visibleCategoryIds = new Set(
    record.categories
      .filter((category) => !category.hidden)
      .map((category) => category.id)
  );
  const publicRecord = {
    ...record,
    categories: record.categories.filter((category) =>
      visibleCategoryIds.has(category.id)
    ),
    items: record.items.filter((item) =>
      visibleCategoryIds.has(item.categoryId)
    ),
  };

  return (
    <main className="menuPage">
      <LocalOrderingMenu restaurant={publicRecord} />
    </main>
  );
}
