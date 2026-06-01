import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";
import {
  MENUI_CONTACT_EMAIL,
  MENUI_LEGAL_LAST_UPDATED,
  MENUI_TRIAL_DAYS,
} from "@/data/legal";

export const metadata: Metadata = {
  title: "Terminos y condiciones | Menui",
  description: "Condiciones basicas de uso, trial y renovacion mensual de Menui.",
};

const sections = [
  {
    title: "1. Alcance del servicio",
    paragraphs: [
      "Menui ofrece una plataforma de menu digital para restaurantes con panel de administracion, subdominio propio y envio de pedidos por WhatsApp.",
      "El restaurante es responsable por la informacion publicada en su menu, sus precios, disponibilidad, tiempos de entrega y atencion al cliente final.",
    ],
  },
  {
    title: "2. Trial y activacion",
    paragraphs: [
      `El plan comercial base incluye un trial de ${MENUI_TRIAL_DAYS} dias corridos desde la creacion del alta, salvo que Menui informe otra vigencia para una promocion o prueba especifica.`,
      "El trial se otorga para evaluar la plataforma. Menui puede limitar, rechazar o suspender trials duplicados, abusivos o inconsistentes con un uso comercial real.",
    ],
  },
  {
    title: "3. Renovacion mensual y pagos",
    paragraphs: [
      "La membresia de Menui es mensual por restaurante. Si el cliente autoriza un cobro recurrente, la suscripcion puede renovarse automaticamente al finalizar cada periodo.",
      "Antes de cobrar un nuevo periodo, el restaurante debe haber recibido el aviso correspondiente dentro del flujo de contratacion o en la adhesion del medio de pago.",
      "Para evitar una renovacion futura, la cancelacion debe gestionarse antes del proximo vencimiento del ciclo en curso.",
    ],
  },
  {
    title: "4. Pedidos por WhatsApp",
    paragraphs: [
      "Menui facilita el armado del pedido y su envio por WhatsApp al numero configurado por el restaurante.",
      "El pedido no se considera aceptado, preparado ni garantizado por Menui. La confirmacion final depende exclusivamente del restaurante a traves de WhatsApp u otro canal directo con el cliente.",
    ],
  },
  {
    title: "5. Metricas y reportes",
    paragraphs: [
      "Las metricas visibles en el panel pueden basarse en eventos de carrito, aperturas, pedidos enviados y otras senales operativas.",
      "Si el restaurante no confirma o registra ventas dentro de Menui, las metricas deben interpretarse como aproximadas y pueden no reflejar la facturacion o cantidad real de pedidos cerrados.",
    ],
  },
  {
    title: "6. Uso aceptable y suspension",
    paragraphs: [
      "No esta permitido usar Menui para publicar contenido ilicito, engañoso, ofensivo o que infrinja derechos de terceros.",
      "Menui puede suspender accesos, menus o subdominios ante falta de pago, uso abusivo, fraude, incumplimientos legales o riesgos tecnicos para la plataforma.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/" className={styles.backLink}>
          Volver a Menui
        </Link>

        <section className={styles.hero}>
          <span className={styles.eyebrow}>Legal</span>
          <h1>Terminos y condiciones</h1>
          <p>
            Estas condiciones regulan el uso basico de Menui antes de escalar la
            operacion comercial.
          </p>
          <span className={styles.meta}>
            Ultima actualizacion: {MENUI_LEGAL_LAST_UPDATED}
          </span>
        </section>

        <section className={styles.content}>
          {sections.map((section) => (
            <article key={section.title} className={styles.section}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ))}

          <div className={styles.noteBox}>
            <p>
              Para consultas sobre estos terminos, podes escribir a{" "}
              <a href={`mailto:${MENUI_CONTACT_EMAIL}`}>{MENUI_CONTACT_EMAIL}</a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
