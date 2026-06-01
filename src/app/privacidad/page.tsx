import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";
import { MENUI_CONTACT_EMAIL, MENUI_LEGAL_LAST_UPDATED } from "@/data/legal";

export const metadata: Metadata = {
  title: "Politica de privacidad | Menui",
  description: "Politica basica de privacidad para restaurantes que usan Menui.",
};

const sections = [
  {
    title: "1. Datos que recopilamos",
    bullets: [
      "Datos del restaurante: nombre comercial, ciudad, rubro, subdominio y configuracion del menu.",
      "Datos del responsable: nombre, email y WhatsApp de contacto.",
      "Datos operativos: productos, categorias, horarios, eventos de carrito, estado de suscripcion y configuraciones administrativas.",
    ],
  },
  {
    title: "2. Para que usamos los datos",
    bullets: [
      "Crear y administrar el acceso al panel del restaurante.",
      "Configurar el menu digital, el subdominio y los pedidos por WhatsApp.",
      "Gestionar cobros, trials, renovaciones, soporte tecnico y comunicaciones operativas.",
      "Medir uso general de la plataforma y mejorar la experiencia del servicio.",
    ],
  },
  {
    title: "3. Pedidos y comunicaciones",
    bullets: [
      "Menui arma mensajes de pedido para ser enviados al WhatsApp configurado por el restaurante.",
      "El restaurante es responsable por la respuesta al cliente, la confirmacion del pedido y el tratamiento posterior de esos datos en su propio canal de WhatsApp.",
    ],
  },
  {
    title: "4. Metricas y exactitud",
    bullets: [
      "Menui puede mostrar metricas de uso, pedidos enviados o actividad comercial estimada.",
      "Si el restaurante no registra o confirma ventas dentro de Menui, esos reportes pueden ser aproximados y no representar con precision la venta cerrada final.",
    ],
  },
  {
    title: "5. Comparticion de datos",
    bullets: [
      "Menui puede compartir datos estrictamente necesarios con proveedores de infraestructura, autenticacion, hosting o cobro recurrente, como Mercado Pago.",
      "No vendemos la base de datos del restaurante a terceros para fines publicitarios masivos.",
    ],
  },
  {
    title: "6. Conservacion y derechos",
    bullets: [
      "Conservamos la informacion mientras exista una relacion comercial, tecnica o legal que lo justifique.",
      "El responsable del restaurante puede solicitar actualizacion o eliminacion de datos, sujeto a obligaciones contractuales, fiscales o de seguridad aplicables.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          Volver a Menui
        </Link>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>Legal</span>
          <h1>Politica de privacidad</h1>
          <p>
            Esta politica resume como Menui recopila, usa y protege los datos
            basicos del restaurante y su operacion.
          </p>
          <span className={styles.meta}>
            Ultima actualizacion: {MENUI_LEGAL_LAST_UPDATED}
          </span>
        </section>

        <section className={styles.content}>
          {sections.map((section) => (
            <article key={section.title} className={styles.section}>
              <h2>{section.title}</h2>
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}

          <div className={styles.noteBox}>
            <p>
              Para consultas de privacidad o actualizacion de datos, podes
              escribir a <a href={`mailto:${MENUI_CONTACT_EMAIL}`}>{MENUI_CONTACT_EMAIL}</a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
