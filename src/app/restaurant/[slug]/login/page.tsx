import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RestaurantLoginForm } from "./restaurant-login-form";
import styles from "./page.module.css";

type RestaurantLoginPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function RestaurantLoginPage({
  params,
}: RestaurantLoginPageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      slug,
    },
    select: {
      name: true,
      slug: true,
      subdomain: true,
      status: true,
    },
  });

  if (!restaurant) {
    notFound();
  }

  return (
    <main className={styles.shell}>
      <section className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <div className={styles.logoBox}>M</div>
          <div>
            <span>Menui Restaurant Admin</span>
            <strong>{restaurant.name}</strong>
          </div>
        </div>

        <div className={styles.brandContent}>
          <span className={styles.eyebrow}>Panel privado</span>
          <h1>Gestioná tu menú, productos y pedidos desde un solo lugar.</h1>
          <p>
            Acceso exclusivo para restaurantes activos en Menui. Desde acá podés
            actualizar precios, fotos, categorías, disponibilidad y WhatsApp de
            recepción.
          </p>
        </div>

        <div className={styles.brandStats}>
          <article>
            <strong>24/7</strong>
            <span>Menú online</span>
          </article>
          <article>
            <strong>WhatsApp</strong>
            <span>Pedidos directos</span>
          </article>
          <article>
            <strong>Admin</strong>
            <span>Autogestionable</span>
          </article>
        </div>
      </section>

      <RestaurantLoginForm
        restaurantName={restaurant.name}
        restaurantSlug={restaurant.slug}
        restaurantStatus={restaurant.status}
      />
    </main>
  );
}