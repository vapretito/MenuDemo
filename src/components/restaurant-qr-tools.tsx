"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import styles from "./restaurant-qr-tools.module.css";

type RestaurantQrToolsProps = {
  restaurantName: string;
  qrMenuUrl: string;
  publicMenuUrl: string;
  localOrderingUrl: string;
  showMenuiBranding: boolean;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  onBrandingChange: (value: boolean) => void;
  onSave: () => void;
};

const MENUI_LOGO_URL = "/logos/menui-logo.svg";
const QR_SIZE = 512;

type QrVariant = "visual" | "interactive";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen ${src}.`));
    image.src = src;
  });

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
  localOrderingUrl,
  showMenuiBranding,
  isSaving,
  error,
  success,
  onBrandingChange,
  onSave,
}: RestaurantQrToolsProps) {
  const [selectedVariant, setSelectedVariant] = useState<QrVariant>("visual");
  const [qrDataUrls, setQrDataUrls] = useState<Record<QrVariant, string>>({
    visual: "",
    interactive: "",
  });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function buildQrCode(
      variant: QrVariant,
      targetUrl: string,
      badgeLabel: string
    ) {
      try {
        const canvas = document.createElement("canvas");

        await QRCode.toCanvas(canvas, targetUrl, {
          width: QR_SIZE,
          margin: 1,
          color: {
            dark: "#102033",
            light: "#ffffff",
          },
        });

        if (showMenuiBranding) {
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("No se pudo preparar el canvas del QR.");
          }

          const logo = await loadImage(MENUI_LOGO_URL);
          const badgeSize = Math.round(QR_SIZE * 0.24);
          const badgeRadius = Math.round(badgeSize * 0.28);
          const badgeX = Math.round((QR_SIZE - badgeSize) / 2);
          const badgeY = Math.round((QR_SIZE - badgeSize) / 2);
          const logoPadding = Math.round(badgeSize * 0.18);
          const logoSize = badgeSize - logoPadding * 2;

          context.fillStyle = "#ffffff";
          context.beginPath();
          context.moveTo(badgeX + badgeRadius, badgeY);
          context.lineTo(badgeX + badgeSize - badgeRadius, badgeY);
          context.quadraticCurveTo(badgeX + badgeSize, badgeY, badgeX + badgeSize, badgeY + badgeRadius);
          context.lineTo(badgeX + badgeSize, badgeY + badgeSize - badgeRadius);
          context.quadraticCurveTo(
            badgeX + badgeSize,
            badgeY + badgeSize,
            badgeX + badgeSize - badgeRadius,
            badgeY + badgeSize
          );
          context.lineTo(badgeX + badgeRadius, badgeY + badgeSize);
          context.quadraticCurveTo(badgeX, badgeY + badgeSize, badgeX, badgeY + badgeSize - badgeRadius);
          context.lineTo(badgeX, badgeY + badgeRadius);
          context.quadraticCurveTo(badgeX, badgeY, badgeX + badgeRadius, badgeY);
          context.closePath();
          context.fill();

          context.drawImage(logo, badgeX + logoPadding, badgeY + logoPadding, logoSize, logoSize);
        }

        const nextQrDataUrl = canvas.toDataURL("image/png");

        if (!cancelled) {
          setQrDataUrls((current) => ({
            ...current,
            [variant]: nextQrDataUrl,
          }));
        }
      } catch (buildError) {
        console.error(`[QR Build Error] ${badgeLabel}`, buildError);

        if (!cancelled) {
          setQrDataUrls((current) => ({
            ...current,
            [variant]: "",
          }));
        }
      }
    }

    void Promise.all([
      buildQrCode("visual", qrMenuUrl, "visual"),
      buildQrCode("interactive", localOrderingUrl, "interactive"),
    ]);

    return () => {
      cancelled = true;
    };
  }, [localOrderingUrl, qrMenuUrl, showMenuiBranding]);

  const qrConfig = {
    visual: {
      title: "QR menu",
      badge: "Menu QR",
      lead: "Version QR sin interaccion para mostrar en el local.",
      description: "Escanea este codigo para ver el menu visual del restaurante.",
      url: qrMenuUrl,
      dataUrl: qrDataUrls.visual,
      downloadName: `${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-menu-qr.png`,
      copyLabel: "Link QR menu copiado.",
      openLabel: "Abrir QR menu",
      copyButtonLabel: "Copiar link menu",
      printButtonLabel: "Imprimir cartel QR menu",
      downloadButtonLabel: "Descargar QR menu PNG",
    },
    interactive: {
      title: "QR interactivo",
      badge: "QR interactivo",
      lead: "Version funcional para que el cliente haga el pedido en restaurant.",
      description:
        "Escanea este codigo para abrir el menu interactivo y registrar pedidos en local.",
      url: localOrderingUrl,
      dataUrl: qrDataUrls.interactive,
      downloadName: `${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-interactivo-qr.png`,
      copyLabel: "Link QR interactivo copiado.",
      openLabel: "Abrir QR interactivo",
      copyButtonLabel: "Copiar link interactivo",
      printButtonLabel: "Imprimir cartel QR interactivo",
      downloadButtonLabel: "Descargar QR interactivo PNG",
    },
  } satisfies Record<
    QrVariant,
    {
      title: string;
      badge: string;
      lead: string;
      description: string;
      url: string;
      dataUrl: string;
      downloadName: string;
      copyLabel: string;
      openLabel: string;
      copyButtonLabel: string;
      printButtonLabel: string;
      downloadButtonLabel: string;
    }
  >;

  const activeQr = qrConfig[selectedVariant];

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(activeQr.url);
      setCopyFeedback(activeQr.copyLabel);
    } catch (copyError) {
      console.error("[QR Copy Error]", copyError);
      setCopyFeedback("No se pudo copiar el link.");
    }
  };

  const handleDownloadQr = () => {
    if (!activeQr.dataUrl) return;

    const link = document.createElement("a");
    link.href = activeQr.dataUrl;
    link.download = activeQr.downloadName;
    link.click();
  };

  const handlePrintPoster = () => {
    if (!activeQr.dataUrl) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");

    if (!printWindow) {
      setCopyFeedback("Tu navegador bloqueo la ventana de impresion.");
      return;
    }

    const title = escapeHtml(restaurantName);
    const url = escapeHtml(activeQr.url);
    const badge = escapeHtml(activeQr.badge);
    const description = escapeHtml(activeQr.description);
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
        <span class="pill">${badge}</span>
        <h1>${title}</h1>
        <p>${description}</p>
        <img class="qr" src="${activeQr.dataUrl}" alt="QR de ${title}" />
        <div class="url">${url}</div>
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
          <span className={styles.eyebrow}>QR del restaurant</span>
          <h3 className={styles.title}>Genera y usa dos QRs distintos segun la necesidad</h3>
          <p className={styles.lead}>
            Desde aca podes elegir si queres trabajar con el <code>QR menu</code> o con el{" "}
            <code>QR interactivo</code>, y luego abrirlo, copiarlo, descargarlo o imprimirlo.
          </p>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span>Link QR visual</span>
              <strong>{qrMenuUrl}</strong>
            </div>
            <div className={styles.metaItem}>
              <span>Menu delivery actual</span>
              <strong>{publicMenuUrl}</strong>
              <p>Esta version conserva carrito y envio por WhatsApp.</p>
            </div>
            <div className={styles.metaItem}>
              <span>Menu QR funcional en restaurant</span>
              <strong>{localOrderingUrl}</strong>
              <p>Esta tercera version registra pedidos en local antes de pasar por caja.</p>
            </div>
          </div>

          <div className={styles.selectorBlock}>
            <span className={styles.selectorLabel}>Que QR queres ver o imprimir</span>
            <div className={styles.selectorRow}>
              <button
                className={
                  selectedVariant === "visual" ? styles.selectorButtonActive : styles.selectorButton
                }
                onClick={() => setSelectedVariant("visual")}
                type="button"
              >
                QR menu
              </button>
              <button
                className={
                  selectedVariant === "interactive"
                    ? styles.selectorButtonActive
                    : styles.selectorButton
                }
                onClick={() => setSelectedVariant("interactive")}
                type="button"
              >
                QR interactivo
              </button>
            </div>
            <p className={styles.selectorHint}>{activeQr.lead}</p>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleCopy}>
              <strong>Logo Menui dentro del QR</strong>
              <p>Activalo si queres incrustar el logo de Menui en el centro del codigo.</p>
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
              {isSaving ? "Guardando..." : "Guardar configuracion QR visual"}
            </button>
            <button className={styles.buttonGhost} onClick={handleCopyUrl} type="button">
              {activeQr.copyButtonLabel}
            </button>
            <a className={styles.buttonLink} href={activeQr.url} rel="noreferrer" target="_blank">
              {activeQr.openLabel}
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
            <span className={styles.eyebrow}>{activeQr.badge}</span>
            <h4>{restaurantName}</h4>
            <p>{activeQr.description}</p>

            <div className={styles.qrWrap}>
              {activeQr.dataUrl ? (
                <img
                  className={styles.qrImage}
                  src={activeQr.dataUrl}
                  alt={`QR de ${restaurantName}`}
                />
              ) : (
                <div className={styles.loading}>Generando QR...</div>
              )}
            </div>

            <div className={styles.url}>{activeQr.url}</div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.buttonGhost}
              disabled={!activeQr.dataUrl}
              onClick={handleDownloadQr}
              type="button"
            >
              {activeQr.downloadButtonLabel}
            </button>
            <button
              className={styles.buttonGhost}
              disabled={!activeQr.dataUrl}
              onClick={handlePrintPoster}
              type="button"
            >
              {activeQr.printButtonLabel}
            </button>
          </div>

          <p className={styles.hint}>
            La impresion y la descarga usan el QR que tengas seleccionado arriba, con el logo centrado si esta activado.
          </p>
        </aside>
      </div>
    </section>
  );
}
