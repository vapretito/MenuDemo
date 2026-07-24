import { redirect } from "next/navigation";
import { BackofficeLoginForm } from "@/components/backoffice-login-form";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import styles from "./page.module.css";

export default async function BackofficeLoginPage() {
  const authenticated = await isBackofficeAuthenticated();

  if (authenticated) {
    redirect("/backoffice");
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <span className={styles.kicker}>Acceso restringido</span>
        <h1>SI NECESITAS AYUDA PARA INGRESAR A UNA DEMO QUE HAYAS CREADO O SOLICITADO CONTACTANOS POR WHATSAPP
        NO SIGAS INTENTANDO EL INGRESO POR ESTE MEDIO.</h1>
        {/* <p>
          SI NECESITAS AYUDA PARA INGRESAR A UNA DEMO QUE HAYAS CREADO O SOLICITADO CONTACTANOS POR WHATSAPP
          NO SIGAS INTENTANDO EL INGRESO POR ESTE MEDIO.
        </p> */}
        <BackofficeLoginForm />
      </section>
    </main>
  );
}
