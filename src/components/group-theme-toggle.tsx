"use client";

import { useEffect, useState } from "react";
import styles from "./group-theme-toggle.module.css";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "menui-group-theme";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.groupTheme = mode;
}

export function GroupThemeToggle() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedMode = window.localStorage.getItem(STORAGE_KEY);
    return savedMode === "dark" || savedMode === "light" ? savedMode : "light";
  });

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  const handleToggle = () => {
    const nextMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextMode);
    applyTheme(nextMode);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    }
  };

  return (
    <button
      aria-label={themeMode === "light" ? "Activar modo nocturno" : "Activar modo claro"}
      aria-pressed={themeMode === "dark"}
      className={styles.toggle}
      onClick={handleToggle}
      type="button"
    >
      <span className={styles.switch} data-theme={themeMode}>
        <span className={styles.trackIcons}>
          <span className={styles.trackIcon}>{"\u2600\uFE0F"}</span>
          <span className={styles.trackIcon}>{"\uD83C\uDF19"}</span>
        </span>
        <span className={styles.thumb} />
      </span>
    </button>
  );
}
