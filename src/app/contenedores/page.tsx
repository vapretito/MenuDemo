import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
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
          <span className={styles.eyebrow}>Menui / {group.name}</span>
          <h1>Elegi un restaurante y entra directo a su menu.</h1>
          <p>
            Esta pagina reune todos los locales del grupo en una sola lista simple
            para que puedas entrar rapido desde el celular.
          </p>
          <div className={styles.heroMeta}>
            <span>{restaurants.length} restaurantes</span>
            <span>Acceso rapido</span>
            <span>Instalable como app</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Locales</span>
            <h2>Restaurantes</h2>
          </div>
        </div>

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

      <section className={styles.section}>
        <div className={styles.installCard}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.eyebrow}>PWA</span>
              <h2>Como instalar esta app</h2>
            </div>
          </div>

          <div className={styles.installGrid}>
            <article className={styles.installBlock}>
              <h3>En iPhone o iPad</h3>
              <ol>
                <li>Abri esta pagina en Safari.</li>
                <li>Toca el boton Compartir.</li>
                <li>Elegí &quot;Agregar a pantalla de inicio&quot;.</li>
                <li>Confirma en &quot;Agregar&quot;.</li>
              </ol>
            </article>

            <article className={styles.installBlock}>
              <h3>En Android</h3>
              <ol>
                <li>Abri esta pagina en Chrome.</li>
                <li>Toca el menu de los tres puntos.</li>
                <li>Elegí &quot;Instalar app&quot; o &quot;Agregar a pantalla principal&quot;.</li>
                <li>Confirma la instalacion.</li>
              </ol>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
