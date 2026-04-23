"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./menu-preview.module.css";
import { menuStylePresets } from "@/data/presets";
import { MenuData } from "@/types/menu";

type MenuPreviewProps = {
  data: MenuData;
  mode?: "default" | "full-page";
  viewport?: "desktop" | "mobile";
};

const slugifyCategory = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function MenuPreview({
  data,
  mode = "default",
  viewport = "desktop",
}: MenuPreviewProps) {
  const shellRef = useRef<HTMLElement | null>(null);
  const mobileRailRef = useRef<HTMLElement | null>(null);
  const mobileRailAnchorRef = useRef<HTMLDivElement | null>(null);
  const [isMobileRailPinned, setIsMobileRailPinned] = useState(false);
  const [mobileRailFrame, setMobileRailFrame] = useState({ left: 0, width: 0 });
  const featuredItem = data.items[0];
  const categorizedItems = data.categories
    .map((category) => ({
      category,
      id: slugifyCategory(category),
      items: data.items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
  const preset =
    menuStylePresets.find((item) => item.id === data.stylePresetId) ?? menuStylePresets[0];
  const presetStyleClass = (() => {
    switch (preset.id) {
      case "brutalist-bistro":
        return styles.brutalistBistro;
      case "luxury-minimal":
        return styles.luxuryMinimal;
      case "retro-mediterranean":
        return styles.retroMediterranean;
      case "playful-color-block":
        return styles.playfulColorBlock;
      case "dark-cinematic":
        return styles.darkCinematic;
      case "restaurant-vintage":
        return styles.restaurantVintage;
      case "fast-bites":
        return styles.fastBites;
      case "artistic":
        return styles.artistic;
      case "cantina-brava":
        return styles.cantinaBrava;
      case "bakery-house":
        return styles.bakeryHouse;
      case "veggie-studio":
        return styles.veggieStudio;
      case "fine-dining":
        return styles.fineDining;
      default:
        return "";
    }
  })();
  const shellClassName = [
    styles.shell,
    styles[preset.layout] ?? "",
    presetStyleClass,
    mode === "full-page" ? styles.fullPage : "",
    viewport === "mobile" ? styles.previewMobileViewport : "",
  ]
    .filter(Boolean)
    .join(" ");

  const showMobileRail = mode === "full-page" || viewport === "mobile";

  useEffect(() => {
    if (mode !== "full-page") return;

    const updateRail = () => {
      const shellNode = shellRef.current;
      const railNode = mobileRailRef.current;
      const anchorNode = mobileRailAnchorRef.current;

      if (!shellNode || !railNode || !anchorNode) return;

      if (window.innerWidth > 640) {
        setIsMobileRailPinned(false);
        return;
      }

      const shellRect = shellNode.getBoundingClientRect();
      const anchorRect = anchorNode.getBoundingClientRect();
      const railHeight = railNode.offsetHeight;
      const shouldPin = anchorRect.top <= 0 && shellRect.bottom - railHeight > 0;

      setIsMobileRailPinned(shouldPin);
      setMobileRailFrame({
        left: Math.max(shellRect.left, 0),
        width: Math.min(shellRect.width, window.innerWidth - Math.max(shellRect.left, 0) * 2),
      });
    };

    updateRail();
    window.addEventListener("scroll", updateRail, { passive: true });
    window.addEventListener("resize", updateRail);

    return () => {
      window.removeEventListener("scroll", updateRail);
      window.removeEventListener("resize", updateRail);
    };
  }, [mode, data.stylePresetId, data.categories.length]);

  return (
    <section
      ref={shellRef}
      className={shellClassName}
      style={
        {
          ["--menu-bg" as string]: data.palette.background,
          ["--menu-surface" as string]: data.palette.surface,
          ["--menu-text" as string]: data.palette.text,
          ["--menu-accent" as string]: data.palette.accent,
          ["--menu-muted" as string]: data.palette.muted,
          ["--menu-border" as string]: data.palette.border,
        } as CSSProperties
      }
    >
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            {data.profile.city} / {preset.audience}
          </p>
          <div>
            <h1 className={styles.heroTitle}>{data.profile.name}</h1>
            <p className={styles.heroText}>{data.profile.concept}</p>
          </div>
          <div className={styles.heroFooter}>
            <span className={styles.heroBadge}>{preset.name}</span>
            <p className={styles.heroText}>{data.profile.note}</p>
          </div>
        </div>

        <div className={styles.heroArt}>
          <div
            className={styles.artImage}
            style={{ backgroundImage: `url(${featuredItem?.image ?? ""})` }}
          />
          <div className={styles.artTint} />
          <div className={styles.artOverlay}>
            <p className={styles.eyebrow}>{preset.badge}</p>
            <h2 className={styles.itemName}>{featuredItem?.name}</h2>
            <p className={styles.heroText}>{featuredItem?.description}</p>
          </div>
        </div>
      </div>

      {showMobileRail ? (
        <>
          <div aria-hidden="true" className={styles.mobileRailAnchor} ref={mobileRailAnchorRef} />
          <nav
            aria-label="Categorias del menu"
            className={`${styles.mobileRail} ${
              mode === "full-page" && isMobileRailPinned ? styles.mobileRailPinned : ""
            }`}
            ref={mobileRailRef}
            style={
              mode === "full-page" && isMobileRailPinned
                ? ({
                    ["--mobile-rail-left" as string]: `${mobileRailFrame.left}px`,
                    ["--mobile-rail-width" as string]: `${mobileRailFrame.width}px`,
                  } as CSSProperties)
                : undefined
            }
          >
            <h2 className={styles.railTitle}>Categorias</h2>
            <div className={styles.mobileRailList}>
              {categorizedItems.map((group) => {
                const total = group.items.length;

                return (
                  <a
                    className={styles.mobileRailCategory}
                    href={`#category-${group.id}`}
                    key={group.category}
                  >
                    <span>{group.category}</span>
                    <span>{String(total).padStart(2, "0")}</span>
                  </a>
                );
              })}
            </div>
          </nav>
          <div
            aria-hidden="true"
            className={`${styles.mobileRailSpacer} ${
              mode === "full-page" && isMobileRailPinned ? styles.mobileRailSpacerVisible : ""
            }`}
          />
        </>
      ) : null}

      <div className={styles.grid}>
        <aside className={styles.rail}>
          <h2 className={styles.railTitle}>Categorias</h2>
          <div className={styles.categoryList}>
            {categorizedItems.map((group) => {
              const total = group.items.length;

              return (
                <a className={styles.category} href={`#category-${group.id}`} key={group.category}>
                  <span>{group.category}</span>
                  <span>{String(total).padStart(2, "0")}</span>
                </a>
              );
            })}
          </div>
        </aside>

        <div className={styles.items}>
          {categorizedItems.map((group) => (
            <section
              className={styles.categorySection}
              id={`category-${group.id}`}
              key={group.category}
            >
              <div className={styles.categorySectionHeader}>
                <h3 className={styles.categorySectionTitle}>{group.category}</h3>
                <span className={styles.categorySectionCount}>
                  {String(group.items.length).padStart(2, "0")} platos
                </span>
              </div>

              <div className={styles.categorySectionItems}>
                {group.items.map((item) => (
                  <article className={styles.item} key={item.id}>
                    <div
                      className={styles.itemThumb}
                      style={{ backgroundImage: `url(${item.image})` }}
                    />

                    <div className={styles.itemMeta}>
                      <div className={styles.itemTopline}>
                        <span className={styles.categoryTag}>{item.category}</span>
                        <span
                          className={`${styles.availability} ${
                            item.available ? "" : styles.availabilityOff
                          }`}
                        >
                          {item.available ? "Disponible" : "No disponible"}
                        </span>
                      </div>

                      <h4 className={styles.itemName}>{item.name}</h4>
                      <p className={styles.itemDescription}>{item.description}</p>
                    </div>

                    <div className={styles.price}>{money.format(item.price)}</div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
