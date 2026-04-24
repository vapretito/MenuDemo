"use client";

import { useEffect, useRef, useState } from "react";
import { MenuPreview } from "@/components/menu-preview";
import { MenuData } from "@/types/menu";

const POSTER_WIDTH = 1180;

type DemoPosterPreviewProps = {
  data: MenuData;
};

export function DemoPosterPreview({ data }: DemoPosterPreviewProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileMode, setMobileMode] = useState<"mobile" | "pdf">("pdf");
  const [posterScale, setPosterScale] = useState(1);
  const [posterHeight, setPosterHeight] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const syncViewport = () => setIsMobileView(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!isMobileView) return;

    const updatePosterFrame = () => {
      const frameNode = frameRef.current;
      const posterNode = posterRef.current;

      if (!frameNode || !posterNode) return;

      const nextScale = Math.min(frameNode.clientWidth / POSTER_WIDTH, 1);
      setPosterScale(nextScale);
      setPosterHeight(posterNode.offsetHeight * nextScale);
    };

    updatePosterFrame();

    const resizeObserver = new ResizeObserver(() => {
      updatePosterFrame();
    });

    if (frameRef.current) resizeObserver.observe(frameRef.current);
    if (posterRef.current) resizeObserver.observe(posterRef.current);

    window.addEventListener("resize", updatePosterFrame);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePosterFrame);
    };
  }, [data, isMobileView]);

  if (!isMobileView) {
    return <MenuPreview data={data} mode="full-page" />;
  }

  const isPdfMode = mobileMode === "pdf";

  return (
    <div className="demo-poster-shell">
      <div className="demo-poster-toolbar">
        <div className="demo-poster-toggle" aria-label="Cambiar modo de vista mobile">
          <button
            className={`demo-poster-toggle-button ${
              mobileMode === "mobile" ? "demo-poster-toggle-button-active" : ""
            }`}
            onClick={() => setMobileMode("mobile")}
            type="button"
          >
            Ver mobile
          </button>
          <button
            className={`demo-poster-toggle-button ${
              mobileMode === "pdf" ? "demo-poster-toggle-button-active" : ""
            }`}
            onClick={() => setMobileMode("pdf")}
            type="button"
          >
            Ver PDF
          </button>
        </div>
        <div className="demo-poster-note">
          {isPdfMode
            ? "Vista tipo lamina para mobile. Mantiene la composicion desktop y la escala para leerla comoda en pantalla chica."
            : "Vista mobile responsive del menu, optimizada para navegarlo desde el telefono."}
        </div>
      </div>

      {isPdfMode ? (
        <div className="demo-poster-frame" ref={frameRef}>
          <div className="demo-poster-canvas" style={{ height: posterHeight || undefined }}>
            <div
              className="demo-poster-scaled"
              ref={posterRef}
              style={{
                transform: `scale(${posterScale})`,
                width: `${POSTER_WIDTH}px`,
              }}
            >
              <MenuPreview data={data} mode="full-page" presentation="poster" />
            </div>
          </div>
        </div>
      ) : (
        <div className="demo-mobile-frame">
          <MenuPreview data={data} mode="full-page" viewport="mobile" />
        </div>
      )}
    </div>
  );
}
