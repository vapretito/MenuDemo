"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    isPointerDown: false,
    hasDragged: false,
    pointerId: -1,
    startY: 0,
    startScrollTop: 0,
  });
  const [step, setStep] = useState(0);
  const [nextStep, setNextStep] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeViewport, setActiveViewport] = useState<"desktop" | "mobile">("desktop");
  const [isDraggingMobilePreview, setIsDraggingMobilePreview] = useState(false);
  const shouldRotate = activeViewport === "desktop";

  useEffect(() => {
    if (!shouldRotate) return;

    const timer = window.setInterval(() => {
      setNextStep((current) => {
        if (current !== null) return current;
        return step + 1;
      });
      setIsTransitioning(true);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [shouldRotate, step]);

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

  const stopMobileDrag = () => {
    dragStateRef.current = {
      isPointerDown: false,
      hasDragged: false,
      pointerId: -1,
      startY: 0,
      startScrollTop: 0,
    };
    setIsDraggingMobilePreview(false);
  };

  const handleMobilePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;

    dragStateRef.current = {
      isPointerDown: true,
      hasDragged: false,
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: mobileScrollRef.current?.scrollTop ?? 0,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMobilePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const scrollNode = mobileScrollRef.current;

    if (!dragState.isPointerDown || dragState.pointerId !== event.pointerId || !scrollNode) return;

    const deltaY = event.clientY - dragState.startY;

    if (!dragState.hasDragged && Math.abs(deltaY) > 3) {
      dragState.hasDragged = true;
      setIsDraggingMobilePreview(true);
    }

    if (!dragState.hasDragged) return;

    scrollNode.scrollTop = dragState.startScrollTop - deltaY;
    event.preventDefault();
  };

  const handleMobilePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stopMobileDrag();
  };

  const handleMobilePointerCancel = () => {
    stopMobileDrag();
  };

  const renderDesktopPreview = () => (
    <>
      <div className={`preview-layer ${isTransitioning ? "preview-layer-out" : ""}`}>
        <MenuPreview data={currentPreviewData} viewport="desktop" />
      </div>
      {incomingPreviewData ? (
        <div className="preview-layer preview-layer-in">
          <MenuPreview data={incomingPreviewData} viewport="desktop" />
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
              Vista desktop
            </button>
            <button
              aria-pressed={activeViewport === "mobile"}
              className={`preview-toggle-button ${
                activeViewport === "mobile" ? "preview-toggle-button-active" : ""
              }`}
              onClick={() => setActiveViewport("mobile")}
              type="button"
            >
              Vista mobile
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
          <div className="preview-stage preview-stage-desktop">{renderDesktopPreview()}</div>
        </div>

        <div
          className={`preview-mobile-device ${
            activeViewport === "mobile" ? "preview-device-active" : "preview-device-hidden"
          }`}
        >
          <div className="preview-device-label">Vista mobile</div>
          <div className="preview-phone-frame">
            <div className="preview-phone-notch" />
            <div className="preview-stage preview-stage-mobile">
              <div
                className={`preview-mobile-scroll ${
                  isDraggingMobilePreview ? "preview-mobile-scroll-dragging" : ""
                }`}
                data-preview-scroll-root="true"
                onPointerCancel={handleMobilePointerCancel}
                onPointerDown={handleMobilePointerDown}
                onPointerMove={handleMobilePointerMove}
                onPointerUp={handleMobilePointerUp}
                ref={mobileScrollRef}
              >
                <MenuPreview data={activePreviewData} viewport="mobile" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
