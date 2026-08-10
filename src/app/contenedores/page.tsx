import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { PwaHelpButton } from "@/components/pwa-help-button";
import { getPublicRestaurantsForGroup } from "@/lib/restaurant-groups";
import type { RestaurantRecord } from "@/types/platform";

export const dynamic = "force-dynamic";

export default async function ContenedoresPage() {
  const result = await getPublicRestaurantsForGroup("contenedores");

  if (!result) {
    notFound();
  }

  const { group, restaurants } = result;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>{group.name}</span>
        </div>
      </section>

      <section className={styles.section}>
        {restaurants.length ? (
          <div className={styles.restaurantList}>
            {restaurants.map((restaurant: RestaurantRecord) => {
              const featuredItem =
                restaurant.items.find(
                  (item: RestaurantRecord["items"][number]) => item.featured
                ) ?? restaurant.items[0];
              const previewImage =
                restaurant.coverImageUrl || featuredItem?.image || undefined;

              return (
                <Link
                  className={styles.restaurantLink}
                  key={restaurant.id}
                  href={`/${group.slug}/${restaurant.slug}/menu`}
                >
                  <article className={styles.restaurantCard}>
                    <div
                      className={styles.restaurantImage}
                      style={{
                        backgroundImage: previewImage ? `url(${previewImage})` : undefined,
                      }}
                    />
                    <div className={styles.restaurantNameWrap}>
                      <h3>{restaurant.name}</h3>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <article className={styles.emptyState}>
            <h3>No hay restaurantes publicados todavia</h3>
            <p>
              Cuando actives locales con pedidos en local y al menos un producto cargado,
              van a aparecer automaticamente en esta portada.
            </p>
          </article>
        )}
      </section>

      <PwaHelpButton />
    </main>
  );
}
