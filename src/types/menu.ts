export type ThemePalette = {
  background: string;
  surface: string;
  text: string;
  accent: string;
  muted: string;
  border: string;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
  image: string;
  category: string;
};

export type RestaurantProfile = {
  name: string;
  city: string;
  concept: string;
  note: string;
};

export type MenuLayout =
  | "editorial"
  | "split"
  | "banner"
  | "catalog"
  | "poster";

export type MenuStylePreset = {
  id: string;
  name: string;
  audience: string;
  description: string;
  layout: MenuLayout;
  badge: string;
};

export type PalettePreset = {
  id: string;
  name: string;
  vibe: string;
  palette: ThemePalette;
};

export type MenuData = {
  profile: RestaurantProfile;
  stylePresetId: string;
  palettePresetId: string;
  palette: ThemePalette;
  categories: string[];
  items: MenuItem[];
};
