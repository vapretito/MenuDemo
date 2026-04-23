import { palettePresets } from "@/data/presets";
import { MenuData } from "@/types/menu";

export const initialMenuData: MenuData = {
  profile: {
    name: "Casa Fuego",
    city: "Buenos Aires",
    concept: "Parrilla de barrio con cocina abierta y platos para compartir.",
    note: "Menu visual pensado para destacar el clima del lugar antes que empujar la venta.",
  },
  stylePresetId: "brutalist-bistro",
  palettePresetId: "paper-ember",
  palette: palettePresets[0].palette,
  categories: ["Entradas", "Principales", "Postres", "Bebidas"],
  items: [
    {
      id: 1,
      name: "Provoleta al hierro",
      description: "Queso dorado, tomate reliquia y oregano fresco.",
      price: 12500,
      available: true,
      image:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
      category: "Entradas",
    },
    {
      id: 2,
      name: "Mollejas crocantes",
      description: "Limon quemado, perejil y fondo de ajo suave.",
      price: 16800,
      available: true,
      image:
        "https://images.unsplash.com/photo-1515669097368-22e68427d265?auto=format&fit=crop&w=900&q=80",
      category: "Entradas",
    },
    {
      id: 3,
      name: "Ojo de bife",
      description: "Con papas rotas y manteca de hierbas.",
      price: 28900,
      available: true,
      image:
        "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80",
      category: "Principales",
    },
    {
      id: 4,
      name: "Pesca del dia",
      description: "Pure rustico, hinojo y jugo de citricos.",
      price: 24100,
      available: false,
      image:
        "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
      category: "Principales",
    },
    {
      id: 5,
      name: "Flan de la casa",
      description: "Doble crema y caramelo oscuro.",
      price: 9500,
      available: true,
      image:
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
      category: "Postres",
    },
    {
      id: 6,
      name: "Vermut preparado",
      description: "Soda helada, naranja y romero.",
      price: 7900,
      available: true,
      image:
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
      category: "Bebidas",
    },
  ],
};
