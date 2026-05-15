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
        <h1>Ingreso del superadmin</h1>
        <p>
          Este acceso queda fuera de la navegacion publica. En produccion, las
          credenciales deben salir de variables de entorno y luego migrarse a auth real
          por roles.
        </p>
        <BackofficeLoginForm />
      </section>
    </main>
  );
}
