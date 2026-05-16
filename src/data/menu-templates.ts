import type { MenuTemplateId } from "@/types/platform";

export type MenuTemplatePreset = {
  id: MenuTemplateId;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  heroGradient: string;
};

export const menuTemplates: MenuTemplatePreset[] = [
  {
    id: "classic-delivery",
    name: "Classic Delivery",
    description: "Rápido, claro y vendedor. Ideal para comidas populares.",
    accent: "#f0c400",
    accentSoft: "#fff1ac",
    surface: "#fffdf7",
    surfaceAlt: "#f4f2e8",
    border: "#1f4723",
    text: "#162218",
    muted: "#58705c",
    heroGradient: "linear-gradient(180deg, #2f7f3a 0%, #1f4723 100%)",
  },
  {
    id: "dark-premium",
    name: "Dark Premium",
    description: "Oscuro, elegante y moderno. Ideal para sushi, bar o cocina de autor.",
    accent: "#f8c15c",
    accentSoft: "#3a2a17",
    surface: "#101318",
    surfaceAlt: "#181d25",
    border: "#303846",
    text: "#f8fafc",
    muted: "#a0aec0",
    heroGradient: "linear-gradient(180deg, #111827 0%, #020617 100%)",
  },
  {
    id: "fresh-green",
    name: "Fresh Green",
    description: "Natural, saludable y limpio. Ideal para bowls, jugos o comida sana.",
    accent: "#22c55e",
    accentSoft: "#dcfce7",
    surface: "#f7fff9",
    surfaceAlt: "#ecfdf3",
    border: "#86efac",
    text: "#052e16",
    muted: "#4b7060",
    heroGradient: "linear-gradient(180deg, #16a34a 0%, #14532d 100%)",
  },
  {
    id: "coffee-cream",
    name: "Coffee Cream",
    description: "Cálido, artesanal y boutique. Ideal para cafeterías y pastelerías.",
    accent: "#9a5c2e",
    accentSoft: "#f4dfc8",
    surface: "#fff8ef",
    surfaceAlt: "#f3e4d4",
    border: "#c49a6c",
    text: "#2b1b10",
    muted: "#7a5b45",
    heroGradient: "linear-gradient(180deg, #7c3f1d 0%, #2b1b10 100%)",
  },
  {
    id: "burger-pop",
    name: "Burger Pop",
    description: "Fuerte, urbano y llamativo. Ideal para burgers, pizzas y fast food.",
    accent: "#ff3d00",
    accentSoft: "#ffe1d6",
    surface: "#fffaf5",
    surfaceAlt: "#ffe8dc",
    border: "#111827",
    text: "#111827",
    muted: "#6b3f2e",
    heroGradient: "linear-gradient(180deg, #ff6b00 0%, #c1121f 100%)",
  },
];