import Link from "next/link";
import styles from "./page.module.css";
import { platformSnapshot } from "@/data/platform";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const benefits = [
  "Carrito por WhatsApp",
  "Subdominio propio",
  "Admin privado",
  "Diseño mobile-first",
  "Sin comisiones por venta",
  "Membresía mensual",
  "Carga de productos",
  "Promos destacadas",
];

const features = [
  {
    eyebrow: "Menú público",
    title: "Una experiencia visual pensada para teléfono",
    text: "El cliente entra, mira categorías, agrega productos y hace el pedido de forma natural desde el celular.",
  },
  {
    eyebrow: "Carrito directo",
    title: "Pedido sin checkout complejo",
    text: "MENUI arma el mensaje y lo envía al WhatsApp del restaurante para acelerar la conversión sin pasarelas innecesarias.",
  },
  {
    eyebrow: "Multi local",
    title: "Cada restaurante con su propio espacio",
    text: "Subdominio, menú, configuración y panel separados para operar varias marcas desde una sola plataforma.",
  },
];

const steps = [
  {
    number: "01",
    title: "Creás el restaurante",
    text: "Desde tu backoffice das de alta el local, elegís plan, estado de membresía y slug/subdominio.",
  },
  {
    number: "02",
    title: "Personalizás su app menú",
    text: "Logo, portada, colores, categorías, productos, fotos, precios, horarios y WhatsApp de recepción.",
  },
  {
    number: "03",
    title: "El cliente pide por WhatsApp",
    text: "El comensal arma el carrito y el sistema envía el pedido ordenado al número del negocio.",
  },
];

export default function Home() {
  const featuredRestaurant = platformSnapshot.restaurants[0];
  const monthlyPrice = 20000;
  const yearlyEstimate = monthlyPrice * 12;

  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.noiseLayer} />
        <div className={styles.orbOne} />
        <div className={styles.orbTwo} />

        <header className={styles.topbar}>
          <Link href="/" className={styles.brand} aria-label="Menui inicio">
            <span className={styles.brandMark}>M</span>
            <span className={styles.brandName}>MENUI</span>
          </Link>

          <nav className={styles.nav} aria-label="Navegación principal">
            <a href="#plataforma">Plataforma</a>
            <a href="#flujo">Flujo</a>
            <a href="#precios">Precios</a>
            <a href="#admin">Admin</a>
          </nav>

          <div className={styles.topbarActions}>
            <Link className={styles.secondaryButton} href={`/menu/${featuredRestaurant.slug}`}>
              Ver demo
            </Link>
            <a className={styles.primaryButton} href="#contacto">
              Contacto
            </a>
          </div>
        </header>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>MENUI para restaurantes</span>
            <h1 className={styles.heroTitle}>
              Tu app menú con pedidos por WhatsApp, lista para vender.
            </h1>
            <p className={styles.heroLead}>
              Diseñás una experiencia mobile para cada restaurante, le das su subdominio,
              su panel privado y un carrito simple que convierte el pedido en mensaje de
              WhatsApp.
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href={`/menu/${featuredRestaurant.slug}`}>
                Probar menú demo
              </Link>
              <Link className={styles.secondaryButton} href="/admin">
                Ver admin demo
              </Link>
            </div>

            <div className={styles.heroNotes} aria-label="Beneficios rápidos">
              <span>14 días gratis</span>
              <span>{money.format(monthlyPrice)} / mes</span>
              <span>Sin comisiones por venta</span>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Preview visual de Menui">
            <div className={styles.floatingBadge}>Pedido listo en 3 pasos</div>
            <div className={styles.phoneMockup}>
              <div className={styles.phoneHeader}>
                <span />
                <strong>{featuredRestaurant.name}</strong>
                <small>Abierto</small>
              </div>
              <div className={styles.menuPreviewHero}>
                <span>Combo destacado</span>
                <strong>Burger + papas</strong>
                <em>{money.format(8500)}</em>
              </div>
              <div className={styles.previewProducts}>
                {featuredRestaurant.items.slice(0, 3).map((product) => (
                  <div className={styles.previewProduct} key={product.id}>
                    <span>{product.name.slice(0, 1)}</span>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{money.format(product.price)}</small>
                    </div>
                    <b>+</b>
                  </div>
                ))}
              </div>
              <div className={styles.phoneCartBar}>
                <span>3 productos</span>
                <strong>Enviar por WhatsApp</strong>
              </div>
            </div>

            <aside className={styles.adminMiniCard}>
              <span>Backoffice</span>
              <strong>12 restaurantes activos</strong>
              <div className={styles.miniProgress}>
                <i />
              </div>
              <p>Pagos, subdominios y estados desde tu superadmin.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.logoSection} aria-label="Características de Menui">
        <p>Un sistema simple para que emprendedores gastronómicos vendan mejor</p>
        <div className={styles.logoTicker}>
          <div className={styles.logoTrack}>
            {[...benefits, ...benefits].map((benefit, index) => (
              <span key={`${benefit}-${index}`}>{benefit}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.infoSection} id="plataforma">
        <div className={styles.sectionIntro}>
          <span className={styles.eyebrowLight}>Plataforma</span>
          <h2>Más vivo que un QR. Más simple que una app de delivery.</h2>
          <p>
            MENUI funciona como una base SaaS: vos diseñás el menú del restaurante,
            el dueño lo administra y el cliente final compra desde el celular.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article className={styles.featureCard} key={feature.title}>
              <span>{feature.eyebrow}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      

     

      <section className={styles.pricingSection} id="precios">
        <div className={styles.sectionIntro}>
          <span className={styles.eyebrowLight}>Precios</span>
          <h2>Un precio mensual fácil de explicar.</h2>
          <p>
            La membresía mantiene online el menú, el subdominio, el panel y el soporte
            base del restaurante.
          </p>
        </div>

        <div className={styles.pricingLayout}>
          <article className={styles.pricingCardMain}>
            <span className={styles.planTag}>Plan MENUI</span>
            <strong>{money.format(monthlyPrice)}</strong>
            <p>por mes, por restaurante</p>
            <ul className={styles.pricingList}>
              <li>14 días gratis para probar la plataforma</li>
              <li>Menú digital mobile-first</li>
              <li>Carrito y pedido directo a WhatsApp</li>
              <li>Panel admin privado para el restaurante</li>
              <li>Soporte para configuración inicial</li>
            </ul>
          </article>

          <article className={styles.pricingCardSide}>
            <h3>Cómo funciona</h3>
            <p>El cliente prueba la app menú con su marca y sus productos.</p>
            <p>Si le sirve, continúa por {money.format(monthlyPrice)} mensuales.</p>
            <p>
              Más adelante podés automatizar la membresía con Mercado Pago y suspender
              restaurantes con pagos vencidos.
            </p>
            <span className={styles.pricingNote}>Planes nuevos próximamente.</span>
          </article>
        </div>
      </section>

      <section className={styles.adminSection} id="admin">
        <div className={styles.sectionIntro}>
          <span className={styles.eyebrowLight}>Demo</span>
          <h2>Así funciona MENUI.</h2>
        </div>

        <div className={styles.adminGrid}>
          <article className={styles.adminCard}>
            <h3>Vista demo del panel admin</h3>
            <p>
              Accedé al panel de administración desde cualquier dispositivo. Agregás
              productos con imágenes, descripciones y precios, eliminás ítems, creás
              categorías nuevas, activás promociones y cambiás fotos en segundos, sin
              necesitar asistencia técnica ni estar en el local.
            </p>
            <Link className={styles.primaryButton} href="/admin">
              Ver demo del admin
            </Link>
          </article>

          <article className={styles.adminCardMuted}>
            <h3>Demo pública del menú</h3>
            <p>
              En la demo pública ves cómo quedaría la experiencia del cliente final.
              El menú es 100% personalizable en la estética: colores, fotos, categorías,
              destacados y estilo visual para adaptarlo a la identidad de cada restaurante.
            </p>
            <Link className={styles.secondaryButton} href={`/menu/${featuredRestaurant.slug}`}>
              Ver demo pública
            </Link>
          </article>
        </div>
      </section>

      <section className={styles.contactBand}>
        <section className={styles.contactSection} id="contacto">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrowLight}>Contacto</span>
            <h2>Hablemos por WhatsApp</h2>
            <p>
              Ideal para mostrar una demo, validar el precio y empezar a venderle a
              restaurantes chicos o emprendedores gastronómicos.
            </p>
          </div>

          <div className={styles.contactLayout}>
            <article className={styles.contactCardMain}>
              <h3>Contacto directo</h3>
              <p>
                Si querés ver una demo, consultar precios o pedir una versión adaptada a tu
                restaurante, podés escribir directo por WhatsApp.
              </p>
              <a
                className={styles.contactButton}
                href="https://wa.me/543516641124?text=Hola%2C%20quiero%20informacion%20sobre%20MENUI"
              >
                Enviar mensaje por WhatsApp
              </a>
            </article>
          </div>
        </section>

        <footer className={styles.footer} id="footer">
          <div className={styles.footerBrand}>
            <span className={styles.brandMark}>M</span>
            <div>
              <strong>MENUI</strong>
              <p>Plataforma de menú digital para restaurantes con carrito y admin privado.</p>
            </div>
          </div>

          <div className={styles.footerColumns}>
            <div>
              <h4>Producto</h4>
              <a href="#plataforma">Plataforma</a>
              <a href="#precios">Precios</a>
              <Link href={`/menu/${featuredRestaurant.slug}`}>Ver menú demo</Link>
            </div>
            <div>
              <h4>Accesos</h4>
              <Link href="/backoffice/login">Login admin privado</Link>
              <Link href="/admin">Panel restaurante</Link>
              <Link href="/superadmin">Superadmin</Link>
            </div>
            <div>
              <h4>Contacto</h4>
              <a href="mailto:hola@menui.oi">hola@menui.oi</a>
              <a href="https://wa.me/543516641124">WhatsApp</a>
              <span>14 días gratis y luego {money.format(monthlyPrice)} / mes</span>
            </div>
          </div>
        </footer>
      </section>

      <div className={styles.mobileBottomBar}>
        <Link className={styles.secondaryButton} href={`/menu/${featuredRestaurant.slug}`}>
          Ver menú
        </Link>
        <a className={styles.primaryButton} href="#contacto">
          Contacto
        </a>
      </div>

      <a
        className={styles.whatsappFloat}
        href="https://wa.me/543516641124?text=Hola%2C%20quiero%20informacion%20sobre%20MENUI"
        aria-label="Escribirme por WhatsApp"
      >
        WhatsApp
      </a>
    </main>
  );
}
