import Link from "next/link";
import { LandingPreviewRotator } from "@/components/landing-preview-rotator";

export default function Home() {
  const whatsappHref =
    "https://wa.me/543516641124?text=Hola%2C%20quiero%20una%20demo%20de%20menu%20visual%20para%20mi%20restaurante";

  return (
    <main className="editorial-page landing-page">
      <section className="corporate-hero">
        <div className="corporate-topbar">
          <p className="kicker">Sistema Visual para Menus</p>
          <div className="corporate-links">
            <Link className="inline-link" href="/demo">
              Ver demo
            </Link>
            <Link className="inline-link" href="/admin">
              Editor
            </Link>
            <a className="inline-link" href={whatsappHref} rel="noreferrer" target="_blank">
              Contacto
            </a>
          </div>
        </div>

        <div className="corporate-hero-grid">
          <div className="corporate-copy">
            <p className="corporate-overline">Menus visuales personalizables para restaurantes</p>
            <h1 className="display-title corporate-title">
              Una experiencia premium de menu con identidad adaptable.
            </h1>
            <p className="lead corporate-lead">
              Presenta menus como un producto digital cuidado. Ajusta esteticas, paleta,
              categorias, precios e imagenes desde un solo editor mientras mantienes un
              resultado elegante, claro y listo para mostrar.
            </p>
            <div className="hero-actions corporate-actions">
              <Link className="button-dark" href="/demo">
                Ver demo
              </Link>
              <Link className="button-light" href="/admin">
                Abrir editor
              </Link>
              <a
                className="button-whatsapp"
                href={whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="corporate-summary">
            <div className="summary-card">
              <span>01</span>
              <p>Multiples esteticas pensadas para distintos conceptos gastronomicos.</p>
            </div>
            <div className="summary-card">
              <span>02</span>
              <p>Editor en vivo para precios, categorias, fotos, disponibilidad y paleta.</p>
            </div>
            <div className="summary-card">
              <span>03</span>
              <p>Base estructurada lista para sumar carrito y menus guardados mas adelante.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="showcase-section">
        <div className="showcase-copy">
          <div>
            <p className="section-label">Sistema de preview</p>
            <h2 className="section-title">
              Una plataforma. Multiples direcciones visuales.
            </h2>
          </div>
          <div className="showcase-text-block">
            <p className="showcase-text">
              La preview en vivo rota entre las esteticas y paletas disponibles para que
              un cliente entienda rapido el rango visual, el nivel de detalle y la
              flexibilidad del producto.
            </p>
            <div className="showcase-mode-strip">
              <div className="showcase-mode-card">
                <p className="section-label">Web Mobile</p>
                <strong>Navegacion optimizada para telefono.</strong>
                <p>
                  El menu puede mostrarse como experiencia web mobile, comoda para recorrer
                  categorias, platos y contenido visual desde pantalla chica.
                </p>
              </div>
              <div className="showcase-mode-card">
                <p className="section-label">Modo PDF</p>
                <strong>Version tipo lamina o documento visual.</strong>
                <p>
                  Tambien puede verse en formato PDF o pieza visual escalada, ideal para
                  conservar una composicion editorial completa sin deformar el diseno.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase-preview">
          <LandingPreviewRotator />
        </div>
      </section>

      <section className="portfolio-grid">
        <article className="portfolio-card">
          <p className="section-label">Esteticas</p>
          <h3>Plantillas premium con identidad clara.</h3>
          <p>
            Cada direccion visual esta pensada para sentirse intencional, solida y
            comercialmente creible para una marca gastronomica real.
          </p>
        </article>
        <article className="portfolio-card wide-card">
          <p className="section-label">Editor</p>
          <h3>Control operativo con una presentacion refinada.</h3>
          <p>
            Gestiona contenido visual y contenido del menu desde una sola interfaz,
            manteniendo un resultado elegante y minimal de cara al cliente.
          </p>
        </article>
        <article className="portfolio-card accent-card">
          <p className="section-label">Escalabilidad</p>
          <h3>Preparado para crecer despues.</h3>
          <p>
            Carrito, autenticacion y configuraciones persistentes pueden sumarse despues
            sin rehacer la experiencia central.
          </p>
        </article>
      </section>

      <section className="contact-strip">
        <div>
          <p className="section-label">Contacto</p>
          <h2 className="contact-title">Si queres una version para tu restaurante, hablemos.</h2>
        </div>
        <a className="button-whatsapp" href={whatsappHref} rel="noreferrer" target="_blank">
          Escribir por WhatsApp
        </a>
      </section>
    </main>
  );
}
