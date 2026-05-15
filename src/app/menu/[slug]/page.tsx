import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileMenu } from "@/components/mobile-menu";
import { platformSnapshot } from "@/data/platform";

type MenuPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MenuPage({ params }: MenuPageProps) {
  const { slug } = await params;
  const restaurant = platformSnapshot.restaurants.find((entry) => entry.slug === slug);

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="menuPage">
      <div className="menuTopbar">
        <Link href="/">Menui</Link>
        <Link href="/admin">Admin</Link>
      </div>
      <MobileMenu restaurant={restaurant} />
    </main>
  );
}
