import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getPublicRestaurantsForGroup } from "@/lib/restaurant-groups";
import type { RestaurantRecord } from "@/types/platform";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

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
          <h1>Una sola portada dentro de Menui para descubrir restaurantes y pedir desde el celular.</h1>
          <p>
            Esta seccion vive dentro de <strong>menui.online/{group.slug}</strong> y
            reutiliza tu flujo actual de pedidos, pero arranca desde una lista
            centralizada de locales en vez de depender de subdominios o QR.
          </p>
          <div className={styles.heroMeta}>
            <span>{restaurants.length} restaurantes listos</span>
            <span>Pedidos directos</span>
            <span>Preparado para PWA</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Locales</span>
            <h2>Elegi donde queres pedir</h2>
          </div>
          <p>
            Cada tarjeta abre un menu como <strong>menui.online/{group.slug}/[slug]/menu</strong>,
            manteniendo una sola app instalada y un solo origen para futuras notificaciones.
          </p>
        </div>

        {restaurants.length ? (
          <div className={styles.grid}>
            {restaurants.map((restaurant: RestaurantRecord) => {
              const featuredItem =
                restaurant.items.find(
                  (item: RestaurantRecord["items"][number]) => item.featured
                ) ?? restaurant.items[0];

              return (
                <article className={styles.card} key={restaurant.id}>
                  <div
                    className={styles.cardMedia}
                    style={{
                      backgroundImage: restaurant.coverImageUrl
                        ? `url(${restaurant.coverImageUrl})`
                        : featuredItem?.image
                          ? `url(${featuredItem.image})`
                          : undefined,
                    }}
                  >
                    <div className={styles.cardOverlay} />
                    <div className={styles.cardBadges}>
                      <span>{restaurant.city}</span>
                      <span>{restaurant.cuisine}</span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <div>
                        <h3>{restaurant.name}</h3>
                        <p>{restaurant.description}</p>
                      </div>
                      <span className={styles.statusPill}>
                        {restaurant.isAcceptingOrders === false ? "Pausado" : "Recibiendo"}
                      </span>
                    </div>

                    <div className={styles.cardStats}>
                      <div>
                        <strong>{restaurant.categories.length}</strong>
                        <span>categorias</span>
                      </div>
                      <div>
                        <strong>{restaurant.items.length}</strong>
                        <span>productos</span>
                      </div>
                      <div>
                        <strong>
                          {featuredItem ? money.format(featuredItem.price) : "Menu listo"}
                        </strong>
                        <span>destacado</span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <div>
                        <span className={styles.featuredLabel}>Recomendado</span>
                        <strong>{featuredItem?.name ?? "Listo para configurar"}</strong>
                      </div>
                      <Link className={styles.cardButton} href={`/${group.slug}/${restaurant.slug}/menu`}>
                        Ver menu
                      </Link>
                    </div>
                  </div>
                </article>
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
    </main>
  );
}
