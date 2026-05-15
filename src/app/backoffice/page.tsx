import { redirect } from "next/navigation";
import { SuperAdminPanel } from "@/components/super-admin-panel";
import { isBackofficeAuthenticated } from "@/lib/backoffice-auth";
import { logoutAction } from "@/app/backoffice/login/actions";
import styles from "./page.module.css";

export default async function BackofficePage() {
  const authenticated = await isBackofficeAuthenticated();

  if (!authenticated) {
    redirect("/backoffice/login");
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.kicker}>Backoffice privado</span>
          <strong>Menui Control Center</strong>
        </div>
        <div className={styles.actions}>
          <span className={styles.status}>Acceso protegido</span>
          <form action={logoutAction}>
            <button className={styles.logoutButton} type="submit">
              Cerrar sesion
            </button>
          </form>
        </div>
      </header>

      <SuperAdminPanel />
    </main>
  );
}
