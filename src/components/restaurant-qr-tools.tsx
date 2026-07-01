"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import styles from "./restaurant-qr-tools.module.css";

type RestaurantQrToolsProps = {
  restaurantName: string;
  qrMenuUrl: string;
  publicMenuUrl: string;
  showMenuiBranding: boolean;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  onBrandingChange: (value: boolean) => void;
  onSave: () => void;
};

const MENUI_LOGO_URL = "/logos/menui-logo.svg";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function RestaurantQrTools({
  restaurantName,
  qrMenuUrl,
  publicMenuUrl,
  showMenuiBranding,
  isSaving,
  error,
  success,
  onBrandingChange,
  onSave,
}: RestaurantQrToolsProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function buildQrCode() {
      try {
        const nextQrDataUrl = await QRCode.toDataURL(qrMenuUrl, {
          width: 512,
          margin: 1,
          color: {
            dark: "#102033",
            light: "#ffffff",
          },
        });

        if (!cancelled) {
          setQrDataUrl(nextQrDataUrl);
        }
      } catch (buildError) {
        console.error("[QR Build Error]", buildError);

        if (!cancelled) {
          setQrDataUrl("");
        }
      }
    }

    void buildQrCode();

    return () => {
      cancelled = true;
    };
  }, [qrMenuUrl]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrMenuUrl);
      setCopyFeedback("Link QR copiado.");
    } catch (copyError) {
      console.error("[QR Copy Error]", copyError);
      setCopyFeedback("No se pudo copiar el link.");
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-menu-qr.png`;
    link.click();
  };

  const handlePrintPoster = () => {
    if (!qrDataUrl) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");

    if (!printWindow) {
      setCopyFeedback("Tu navegador bloqueo la ventana de impresion.");
      return;
    }

    const title = escapeHtml(restaurantName);
    const url = escapeHtml(qrMenuUrl);
    const brandMarkup = showMenuiBranding
      ? `<img src="${MENUI_LOGO_URL}" alt="Menui" style="width:140px;height:auto;margin-top:20px;" />`
      : "";

    printWindow.document.write(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>QR ${title}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #f5f7fa;
        color: #102033;
      }
      .sheet {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px;
      }
      .poster {
        width: min(100%, 520px);
        border: 2px solid #d9e3ea;
        border-radius: 32px;
        background: #ffffff;
        padding: 32px;
        text-align: center;
      }
      .pill {
        display: inline-block;
        border-radius: 999px;
        background: #dff7ef;
        color: #0d6a4f;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      h1 {
        margin: 16px 0 10px;
        font-size: 40px;
        line-height: 1;
      }
      p {
        margin: 0;
        color: #5e7184;
        line-height: 1.6;
      }
      img.qr {
        width: 320px;
        height: 320px;
        margin: 28px auto 20px;
        display: block;
      }
      .url {
        margin-top: 18px;
        font-size: 15px;
        font-weight: 700;
        word-break: break-word;
      }
      @media print {
        body { background: #ffffff; }
        .sheet { padding: 0; }
        .poster { border: 0; width: 100%; max-width: none; }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <section class="poster">
        <span class="pill">Menu QR</span>
        <h1>${title}</h1>
        <p>Escanea este codigo para ver el menu visual del restaurante.</p>
        <img class="qr" src="${qrDataUrl}" alt="QR del menu de ${title}" />
        <div class="url">${url}</div>
        ${brandMarkup}
      </section>
    </main>
    <script>
      window.onload = function () {
        window.print();
      };
    </script>
  </body>
</html>`);
    printWindow.document.close();
  };

  return (
    <section className={styles.stack}>
      <div className={styles.layout}>
        <article className={styles.card}>
          <span className={styles.eyebrow}>Menu QR</span>
          <h3 className={styles.title}>Version visual sin carrito para mostrar en el local</h3>
          <p className={styles.lead}>
            Este link abre el menu completo en modo visual, ideal para mesas, mostrador o carteles
            impresos. La URL publica recomendada es la del subdominio con <code>/qr</code>.
          </p>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span>Link QR del restaurante</span>
              <strong>{qrMenuUrl}</strong>
            </div>
            <div className={styles.metaItem}>
              <span>Menu principal actual</span>
              <strong>{publicMenuUrl}</strong>
              <p>El menu normal conserva su carrito. El QR abre la variante solo visual.</p>
            </div>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleCopy}>
              <strong>Branding Menui en el cartel</strong>
              <p>Activalo si queres imprimir el QR con el logo de Menui al pie.</p>
            </div>

            <label className={styles.toggle}>
              <input
                checked={showMenuiBranding}
                type="checkbox"
                onChange={(event) => onBrandingChange(event.target.checked)}
              />
              <span>{showMenuiBranding ? "Visible" : "Oculto"}</span>
            </label>
          </div>

          <div className={styles.actions}>
            <button className={styles.button} disabled={isSaving} onClick={onSave} type="button">
              {isSaving ? "Guardando..." : "Guardar configuracion QR"}
            </button>
            <button className={styles.buttonGhost} onClick={handleCopyUrl} type="button">
              Copiar link QR
            </button>
            <a className={styles.buttonLink} href={qrMenuUrl} rel="noreferrer" target="_blank">
              Abrir menu QR
            </a>
          </div>

          {copyFeedback ? (
            <div className={`${styles.status} ${styles.success}`}>{copyFeedback}</div>
          ) : null}
          {success ? <div className={`${styles.status} ${styles.success}`}>{success}</div> : null}
          {error ? <div className={`${styles.status} ${styles.error}`}>{error}</div> : null}
        </article>

        <aside className={`${styles.card} ${styles.previewCard}`}>
          <span className={styles.previewLabel}>Vista previa imprimible</span>

          <div className={styles.poster}>
            <span className={styles.eyebrow}>Escanea el menu</span>
            <h4>{restaurantName}</h4>
            <p>Menu visual del restaurante sin carrito para mostrar en salon.</p>

            <div className={styles.qrWrap}>
              {qrDataUrl ? (
                <img className={styles.qrImage} src={qrDataUrl} alt={`QR de ${restaurantName}`} />
              ) : (
                <div className={styles.loading}>Generando QR...</div>
              )}
            </div>

            <div className={styles.url}>{qrMenuUrl}</div>
            {showMenuiBranding ? (
              <img className={styles.brandMark} src={MENUI_LOGO_URL} alt="Menui" />
            ) : null}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.buttonGhost}
              disabled={!qrDataUrl}
              onClick={handleDownloadQr}
              type="button"
            >
              Descargar QR PNG
            </button>
            <button
              className={styles.buttonGhost}
              disabled={!qrDataUrl}
              onClick={handlePrintPoster}
              type="button"
            >
              Imprimir cartel QR
            </button>
          </div>

          <p className={styles.hint}>
            La impresion abre una hoja limpia con nombre del restaurante, QR y logo Menui opcional.
          </p>
        </aside>
      </div>
    </section>
  );
}
