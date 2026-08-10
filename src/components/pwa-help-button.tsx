"use client";

import { useEffect, useState } from "react";
import styles from "./pwa-help-button.module.css";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  const displayModeStandalone = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;

  return iosStandalone || displayModeStandalone;
}

export function PwaHelpButton() {
  const [isInstalled, setIsInstalled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateInstalledState = () => {
      setIsInstalled(isStandaloneMode());
    };

    updateInstalledState();

    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", updateInstalledState);
    window.addEventListener("appinstalled", updateInstalledState);

    return () => {
      mediaQuery.removeEventListener("change", updateInstalledState);
      window.removeEventListener("appinstalled", updateInstalledState);
    };
  }, []);

  if (isInstalled) {
    return null;
  }

  return (
    <div className={`${styles.wrapper} ${isOpen ? styles.wrapperOpen : ""}`}>
      <button
        aria-controls="pwa-help-panel"
        aria-expanded={isOpen}
        className={styles.toggle}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={styles.toggleIcon}>{isOpen ? "x" : "?"}</span>
        <span>Ayuda para instalar</span>
      </button>

      <div
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        id="pwa-help-panel"
      >
        <div className={styles.panelHeader}>
          <span className={styles.badge}>PWA</span>
          <h2>Instalar esta app</h2>
          <p>
            Si queres tener acceso rapido desde tu pantalla principal, segui estos
            pasos.
          </p>
        </div>

        <div className={styles.grid}>
          <article className={styles.block}>
            <h3>iPhone o iPad</h3>
            <ol>
              <li>Abri esta pagina en Safari.</li>
              <li>Toca el boton Compartir.</li>
              <li>Elegi &quot;Agregar a pantalla de inicio&quot;.</li>
              <li>Confirma en &quot;Agregar&quot;.</li>
            </ol>
          </article>

          <article className={styles.block}>
            <h3>Android</h3>
            <ol>
              <li>Abri esta pagina en Chrome.</li>
              <li>Toca el menu de los tres puntos.</li>
              <li>Elegi &quot;Instalar app&quot; o &quot;Agregar a pantalla principal&quot;.</li>
              <li>Confirma la instalacion.</li>
            </ol>
          </article>
        </div>
      </div>
    </div>
  );
}
