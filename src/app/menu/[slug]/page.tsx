import { notFound } from "next/navigation";
import { MobileMenu } from "@/components/mobile-menu";
import { platformSnapshot } from "@/data/platform";

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
  const restaurant = platformSnapshot.restaurants.find((entry) => entry.slug === slug);

  if (!restaurant) {
    notFound();
  }

  const isDemoMenu = restaurant.slug === "demo" || restaurant.connectedToDemo;
  return (
    <main className="menuPage">
      {isDemoMenu ? (
        <a className="demoBackButton" href={getMarketingUrl()}>
          ← Volver
        </a>
      ) : null}

      <MobileMenu restaurant={restaurant} />
    </main>
  );
}