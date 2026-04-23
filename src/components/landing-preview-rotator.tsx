"use client";

import { useEffect, useState } from "react";
import { MenuPreview } from "@/components/menu-preview";
import { initialMenuData } from "@/data/menu";
import { menuStylePresets, palettePresets } from "@/data/presets";
import { MenuData } from "@/types/menu";

const ROTATION_MS = 4200;
const FADE_MS = 850;

const buildPreviewData = (index: number): MenuData => {
  const stylePreset = menuStylePresets[index % menuStylePresets.length];
  const palettePreset = palettePresets[(index * 3) % palettePresets.length];

  return {
    ...initialMenuData,
    stylePresetId: stylePreset.id,
    palettePresetId: palettePreset.id,
    palette: palettePreset.palette,
  };
};

export function LandingPreviewRotator() {
  const [step, setStep] = useState(0);
  const [nextStep, setNextStep] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeViewport, setActiveViewport] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNextStep((current) => {
        if (current !== null) return current;
        return step + 1;
      });
      setIsTransitioning(true);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (nextStep === null) return;

    const timer = window.setTimeout(() => {
      setStep(nextStep);
      setNextStep(null);
      setIsTransitioning(false);
    }, FADE_MS);

    return () => window.clearTimeout(timer);
  }, [nextStep]);

  const currentPreviewData = buildPreviewData(step);
  const incomingPreviewData = nextStep !== null ? buildPreviewData(nextStep) : null;
  const activePreviewData = incomingPreviewData ?? currentPreviewData;
  const activeStyle = menuStylePresets.find((item) => item.id === activePreviewData.stylePresetId);
  const activePalette = palettePresets.find((item) => item.id === activePreviewData.palettePresetId);

  const renderPreviewLayer = (viewport: "desktop" | "mobile") => (
    <>
      <div className={`preview-layer ${isTransitioning ? "preview-layer-out" : ""}`}>
        <MenuPreview data={currentPreviewData} viewport={viewport} />
      </div>
      {incomingPreviewData ? (
        <div className="preview-layer preview-layer-in">
          <MenuPreview data={incomingPreviewData} viewport={viewport} />
        </div>
      ) : null}
    </>
  );

  return (
    <div className="rotating-preview-shell">
      <div className="rotating-preview-meta">
        <div className="rotating-preview-note">
          <span className="preview-dot" />
          <span>Alterna estilos y paletas para mostrar el rango visual del sistema.</span>
        </div>

        <div className="preview-meta-actions">
          <div className="preview-toggle" aria-label="Cambiar vista de preview">
            <button
              aria-pressed={activeViewport === "desktop"}
              className={`preview-toggle-button ${
                activeViewport === "desktop" ? "preview-toggle-button-active" : ""
              }`}
              onClick={() => setActiveViewport("desktop")}
              type="button"
            >
              View desktop
            </button>
            <button
              aria-pressed={activeViewport === "mobile"}
              className={`preview-toggle-button ${
                activeViewport === "mobile" ? "preview-toggle-button-active" : ""
              }`}
              onClick={() => setActiveViewport("mobile")}
              type="button"
            >
              View mobile
            </button>
          </div>

          <div className="preview-badges">
            <span className="preview-badge">Estilo: {activeStyle?.name}</span>
            <span className="preview-badge">Paleta: {activePalette?.name}</span>
          </div>
        </div>
      </div>

      <div className="preview-device-grid">
        <div
          className={`preview-desktop-device ${
            activeViewport === "desktop" ? "preview-device-active" : "preview-device-hidden"
          }`}
        >
          <div className="preview-device-label">Vista desktop</div>
          <div className="preview-stage preview-stage-desktop">{renderPreviewLayer("desktop")}</div>
        </div>

        <div
          className={`preview-mobile-device ${
            activeViewport === "mobile" ? "preview-device-active" : "preview-device-hidden"
          }`}
        >
          <div className="preview-device-label">Vista mobile</div>
          <div className="preview-phone-frame">
            <div className="preview-phone-notch" />
            <div className="preview-stage preview-stage-mobile">{renderPreviewLayer("mobile")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
