import { notFound, redirect } from "next/navigation";
import { LocalOrderingMenu } from "@/components/local-ordering-menu";
import { getValidGuestSessionForRestaurant } from "@/lib/guest-session";
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
  const guestSession = await getValidGuestSessionForRestaurant(slug);

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

  if (!guestSession) {
    return (
      <main className="menuPage">
        <section
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "96px 24px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              marginBottom: 16,
              padding: "8px 14px",
              borderRadius: 999,
              background: "#e7f8ef",
              color: "#0d6a4f",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Acceso solo por QR
          </span>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Escanea el QR del local para pedir desde este menu
          </h1>
          <p style={{ margin: "0 auto", maxWidth: 520, lineHeight: 1.6, color: "#516173" }}>
            Esta version de {restaurant.name} solo permite pedidos iniciados desde una
            sesion activa del QR del restaurante. Si estas en el local, volve a escanear
            el codigo para continuar.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="menuPage">
      <LocalOrderingMenu restaurant={publicRecord} />
    </main>
  );
}
