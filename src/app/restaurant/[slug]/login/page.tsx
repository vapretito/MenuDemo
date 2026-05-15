import Link from "next/link";
import styles from "./page.module.css";

type RestaurantLoginPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const formatRestaurantName = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default async function RestaurantLoginPage({
  params,
}: RestaurantLoginPageProps) {
  const { slug } = await params;
  const restaurantName = formatRestaurantName(slug);

  return (
    <main className={styles.shell}>
      <section className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <div className={styles.logoBox}>M</div>
          <div>
            <span>Menui Restaurant Admin</span>
            <strong>{restaurantName}</strong>
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

      <section className={styles.loginPanel}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <span className={styles.eyebrow}>Ingresar</span>
            <h2>Acceso del restaurante</h2>
            <p>
              Entrá con las credenciales asignadas para administrar el menú de{" "}
              <strong>{restaurantName}</strong>.
            </p>
          </div>

          <form className={styles.form}>
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                placeholder="admin@restaurante.com"
                type="email"
              />
            </label>

            <label>
              <span>Contraseña</span>
              <input
                autoComplete="current-password"
                name="password"
                placeholder="••••••••"
                type="password"
              />
            </label>

            <button className={styles.primaryButton} type="button">
              Entrar al panel
            </button>
          </form>

          <div className={styles.demoBox}>
            <span>Demo activa</span>
            <p>
              Este acceso todavía está en modo visual/demo. Luego conectamos
              autenticación real por restaurante.
            </p>
          </div>

          <div className={styles.footerActions}>
            <Link href="/">Ver menú público</Link>
            <Link href="/admin">Ir al admin demo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}