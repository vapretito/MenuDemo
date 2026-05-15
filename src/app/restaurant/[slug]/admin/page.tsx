import { notFound } from "next/navigation";
import { MobileMenu } from "@/components/mobile-menu";
import { prisma } from "@/lib/prisma";
import { mapRestaurantToRecord } from "@/lib/restaurant-mapper";
import { redirect } from "next/navigation";
type MenuPageProps = {
  params: Promise<{ slug: string }>;
};

const getMarketingUrl = () => {
  const rootDomain = process.env.MENUI_ROOT_DOMAIN ?? "menui.online";

  if (process.env.NODE_ENV === "development") {
    return "/";
  }

  return `https://${rootDomain}`;
};

export default async function MenuPage({ params }: MenuPageProps) {
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

  const record = mapRestaurantToRecord(restaurant);

  
  const isDemoMenu = record.slug === "demo" || record.connectedToDemo;
  if (restaurant.status !== "ACTIVE" && restaurant.slug !== "demo") {
    redirect(`/activar/${restaurant.slug}`);
  }
  return (
    <main className="menuPage">
      {isDemoMenu ? (
        <a className="demoBackButton" href={getMarketingUrl()}>
          ← Volver
        </a>
      ) : null}

      <MobileMenu restaurant={record} />
    </main>
  );
}