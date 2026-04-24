"use client";

import { ChangeEvent, KeyboardEvent, useState } from "react";
import styles from "./admin-panel.module.css";
import { initialMenuData } from "@/data/menu";
import { menuStylePresets, palettePresets } from "@/data/presets";
import { MenuPreview } from "@/components/menu-preview";
import { MenuData, MenuItem } from "@/types/menu";

const emptyItem = (id: number, category: string): MenuItem => ({
  id,
  name: "Nuevo plato",
  description: "Descripcion breve del plato y su personalidad en mesa.",
  price: 0,
  available: true,
  image: "",
  category,
});

const sectionIcons = {
  identity: "ID",
  styles: "ST",
  palette: "CL",
  categories: "CT",
  items: "PL",
} as const;

export function AdminPanel() {
  const [data, setData] = useState<MenuData>(initialMenuData);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isPublishNoticeOpen, setIsPublishNoticeOpen] = useState(false);
  const [openSection, setOpenSection] = useState<
    "identity" | "styles" | "palette" | "categories" | "items"
  >("styles");
  const styleToPalette: Record<string, string> = {
    "brutalist-bistro": "paper-ember",
    "luxury-minimal": "sepia-cellar",
    "retro-mediterranean": "neon-ketchup",
    "playful-color-block": "jade-lacquer",
    "dark-cinematic": "red-gate",
    "restaurant-vintage": "butter-cream",
    "fast-bites": "agave-sunset",
    artistic: "jade-lacquer",
    "cantina-brava": "agave-sunset",
    "fine-dining": "night-service",
  };

  const updateProfile = (field: keyof MenuData["profile"], value: string) => {
    setData((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value },
    }));
  };

  const updatePalette = (field: keyof MenuData["palette"], value: string) => {
    setData((current) => ({
      ...current,
      palettePresetId: "custom",
      palette: { ...current.palette, [field]: value },
    }));
  };

  const applyPalettePreset = (palettePresetId: string) => {
    const preset = palettePresets.find((item) => item.id === palettePresetId);
    if (!preset) return;

    setData((current) => ({
      ...current,
      palettePresetId,
      palette: preset.palette,
    }));
  };

  const applyStylePreset = (stylePresetId: string) => {
    const linkedPaletteId = styleToPalette[stylePresetId];
    const linkedPalette = palettePresets.find((item) => item.id === linkedPaletteId);

    setData((current) => ({
      ...current,
      stylePresetId,
      palettePresetId: linkedPalette?.id ?? current.palettePresetId,
      palette: linkedPalette?.palette ?? current.palette,
    }));
  };

  const updateItem = <K extends keyof MenuItem>(id: number, field: K, value: MenuItem[K]) => {
    setData((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addItem = () => {
    setData((current) => {
      const id = Date.now();
      const fallbackCategory = current.categories[0] ?? "Categoria";

      return {
        ...current,
        items: [...current.items, emptyItem(id, fallbackCategory)],
      };
    });
  };

  const deleteItem = (id: number) => {
    setData((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== id),
    }));
  };

  const addCategory = () => {
    const normalizedName = newCategoryName.trim();
    if (!normalizedName) return;

    setData((current) => {
      if (current.categories.includes(normalizedName)) {
        return current;
      }

      return {
        ...current,
        categories: [...current.categories, normalizedName],
      };
    });

    setNewCategoryName("");
  };

  const deleteCategory = (categoryToDelete: string) => {
    setData((current) => {
      const nextCategories = current.categories.filter((category) => category !== categoryToDelete);

      if (nextCategories.length === 0) {
        return current;
      }

      return {
        ...current,
        categories: nextCategories,
        items: current.items.filter((item) => item.category !== categoryToDelete),
      };
    });
  };

  const handleCategoryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCategory();
    }
  };

  const handleImageUpload = (id: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        updateItem(id, "image", result);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (id: number) => {
    updateItem(id, "image", "");
  };

  const resetDemo = () => setData(initialMenuData);

  const sections = [
    ["identity", "Restaurante"],
    ["styles", "Esteticas"],
    ["palette", "Paleta"],
    ["categories", "Categorias"],
    ["items", "Platos"],
  ] as const;

  return (
    <div className={styles.adminShell}>
      <aside className={styles.editor}>
        <div className={styles.editorHeader}>
          <div className={styles.headerCopy}>
            <p className={styles.blockTitle}>Editor visual</p>
            <strong className={styles.editorTitle}>Menu Builder</strong>
            <p className={styles.editorSubtitle}>
              Workspace de marca para editar contenido, color y atmosfera del menu.
            </p>
          </div>
          <div className={styles.headerBadges}>
            <span className={styles.headerPill}>Live Preview</span>
            <button
              className={styles.publishButton}
              onClick={() => setIsPublishNoticeOpen(true)}
              type="button"
            >
              Publicar / actualizar menu
            </button>
            <button className={styles.ghostButton} onClick={resetDemo} type="button">
              Restaurar
            </button>
          </div>
        </div>

        <div className={styles.editorNav}>
          {sections.map(([id, label]) => (
            <button
              className={`${styles.toolButton} ${openSection === id ? styles.toolButtonActive : ""}`}
              key={id}
              onClick={() => setOpenSection(id)}
              type="button"
            >
              <span className={styles.toolIcon}>{sectionIcons[id]}</span>
              <span className={styles.toolLabel}>{label}</span>
            </button>
          ))}
        </div>

        <div className={styles.panelStack}>
          <section className={styles.block}>
            <button
              className={styles.sectionToggle}
              onClick={() => setOpenSection("identity")}
              type="button"
            >
              <span>Identidad del restaurante</span>
              <span>{openSection === "identity" ? "−" : "+"}</span>
            </button>
            {openSection === "identity" ? (
              <div className={styles.sectionBody}>
                <div className={styles.fieldGrid}>
                  <label className={styles.fieldRow}>
                    <span>Nombre</span>
                    <input
                      className={styles.input}
                      value={data.profile.name}
                      onChange={(event) => updateProfile("name", event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldRow}>
                    <span>Ciudad</span>
                    <input
                      className={styles.input}
                      value={data.profile.city}
                      onChange={(event) => updateProfile("city", event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldRow}>
                    <span>Concepto</span>
                    <textarea
                      className={styles.textarea}
                      value={data.profile.concept}
                      onChange={(event) => updateProfile("concept", event.target.value)}
                    />
                  </label>
                  <label className={styles.fieldRow}>
                    <span>Nota editorial</span>
                    <textarea
                      className={styles.textarea}
                      value={data.profile.note}
                      onChange={(event) => updateProfile("note", event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </section>

          <section className={styles.block}>
            <button
              className={styles.sectionToggle}
              onClick={() => setOpenSection("styles")}
              type="button"
            >
              <span>Esteticas predeterminadas</span>
              <span>{openSection === "styles" ? "−" : "+"}</span>
            </button>
            {openSection === "styles" ? (
              <div className={styles.sectionBody}>
                <div className={styles.presetGrid}>
                  {menuStylePresets.map((preset) => (
                    <button
                      className={`${styles.presetCard} ${
                        data.stylePresetId === preset.id ? styles.presetCardActive : ""
                      }`}
                      key={preset.id}
                      onClick={() => applyStylePreset(preset.id)}
                      type="button"
                    >
                      <div className={styles.presetThumb} data-preset={preset.id} />
                      <span className={styles.presetBadge}>{preset.badge}</span>
                      <strong>{preset.name}</strong>
                      <span>{preset.audience}</span>
                      <p>{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className={styles.block}>
            <button
              className={styles.sectionToggle}
              onClick={() => setOpenSection("palette")}
              type="button"
            >
              <span>Paleta del menu</span>
              <span>{openSection === "palette" ? "−" : "+"}</span>
            </button>
            {openSection === "palette" ? (
              <div className={styles.sectionBody}>
                <div className={styles.palettePresetGrid}>
                  {palettePresets.map((preset) => (
                    <button
                      className={`${styles.paletteCard} ${
                        data.palettePresetId === preset.id ? styles.presetCardActive : ""
                      }`}
                      key={preset.id}
                      onClick={() => applyPalettePreset(preset.id)}
                      type="button"
                    >
                      <div className={styles.paletteSwatches}>
                        {Object.values(preset.palette).map((value) => (
                          <span
                            className={styles.paletteDot}
                            key={`${preset.id}-${value}`}
                            style={{ background: value }}
                          />
                        ))}
                      </div>
                      <strong>{preset.name}</strong>
                      <span>{preset.vibe}</span>
                    </button>
                  ))}
                </div>

                <div className={styles.fieldPair}>
                  {(
                    [
                      ["background", "Fondo"],
                      ["surface", "Superficie"],
                      ["text", "Texto"],
                      ["accent", "Acento"],
                      ["muted", "Texto secundario"],
                      ["border", "Bordes"],
                    ] as const
                  ).map(([key, label]) => (
                    <label className={styles.fieldRow} key={key}>
                      <span>{label}</span>
                      <div className={styles.colorControl}>
                        <input
                          className={styles.colorPicker}
                          type="color"
                          value={data.palette[key]}
                          onChange={(event) => updatePalette(key, event.target.value)}
                        />
                        <input
                          className={styles.input}
                          value={data.palette[key]}
                          onChange={(event) => updatePalette(key, event.target.value)}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className={styles.block}>
            <button
              className={styles.sectionToggle}
              onClick={() => setOpenSection("categories")}
              type="button"
            >
              <span>Categorias</span>
              <span>{openSection === "categories" ? "−" : "+"}</span>
            </button>
            {openSection === "categories" ? (
              <div className={styles.sectionBody}>
                <div className={styles.categoryManager}>
                  <div className={styles.inlineAction}>
                    <input
                      className={styles.input}
                      placeholder="Nueva categoria"
                      value={newCategoryName}
                      onChange={(event) => setNewCategoryName(event.target.value)}
                      onKeyDown={handleCategoryKeyDown}
                    />
                    <button className={styles.button} onClick={addCategory} type="button">
                      Agregar
                    </button>
                  </div>

                  <div className={styles.categoryChipList}>
                    {data.categories.map((category) => (
                      <div className={styles.categoryChip} key={category}>
                        <span>{category}</span>
                        <span className={styles.categoryMeta}>
                          {
                            data.items.filter((item) => item.category === category).length
                          }{" "}
                          platos
                        </span>
                        <button
                          className={styles.deleteButton}
                          disabled={data.categories.length === 1}
                          onClick={() => deleteCategory(category)}
                          type="button"
                        >
                          Borrar
                        </button>
                      </div>
                    ))}
                  </div>
                  {data.categories.length === 1 ? (
                    <p className={styles.helperText}>
                      Necesitas al menos una categoria activa para seguir creando platos.
                    </p>
                  ) : (
                    <p className={styles.helperText}>
                      Al borrar una categoria tambien se eliminan sus platos asociados.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          <section className={styles.block}>
            <button
              className={styles.sectionToggle}
              onClick={() => setOpenSection("items")}
              type="button"
            >
              <span>Platos y disponibilidad</span>
              <span>{openSection === "items" ? "−" : "+"}</span>
            </button>
            {openSection === "items" ? (
              <div className={styles.sectionBody}>
                <div className={styles.actions}>
                  <button className={styles.button} onClick={addItem} type="button">
                    Agregar plato
                  </button>
                </div>

                <div className={styles.itemList}>
                  {data.items.map((item) => (
                    <article className={styles.itemEditor} key={item.id}>
                      <div className={styles.itemEditorHeader}>
                        <strong>{item.name || "Nuevo plato"}</strong>
                        <button
                          className={styles.deleteButton}
                          onClick={() => deleteItem(item.id)}
                          type="button"
                        >
                          Borrar plato
                        </button>
                      </div>

                      <div className={styles.fieldPair}>
                        <label className={styles.fieldRow}>
                          <span>Nombre</span>
                          <input
                            className={styles.input}
                            value={item.name}
                            onChange={(event) => updateItem(item.id, "name", event.target.value)}
                          />
                        </label>
                        <label className={styles.fieldRow}>
                          <span>Precio</span>
                          <input
                            className={styles.input}
                            type="number"
                            value={item.price}
                            onChange={(event) =>
                              updateItem(item.id, "price", Number(event.target.value))
                            }
                          />
                        </label>
                      </div>

                      <div className={styles.fieldPair}>
                        <label className={styles.fieldRow}>
                          <span>Categoria</span>
                          <select
                            className={styles.select}
                            value={item.category}
                            onChange={(event) =>
                              updateItem(item.id, "category", event.target.value)
                            }
                          >
                            {data.categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={styles.fieldRow}>
                          <span>Foto del plato</span>
                          <div className={styles.uploadStack}>
                            <input
                              accept="image/*"
                              className={styles.input}
                              type="file"
                              onChange={(event) => handleImageUpload(item.id, event)}
                            />
                            <button
                              className={styles.ghostButton}
                              onClick={() => clearImage(item.id)}
                              type="button"
                            >
                              Quitar foto
                            </button>
                            {item.image ? (
                              <div
                                className={styles.imagePreview}
                                style={{ backgroundImage: `url(${item.image})` }}
                              />
                            ) : null}
                          </div>
                        </label>
                      </div>

                      <label className={styles.fieldRow}>
                        <span>Descripcion</span>
                        <textarea
                          className={styles.textarea}
                          value={item.description}
                          onChange={(event) =>
                            updateItem(item.id, "description", event.target.value)
                          }
                        />
                      </label>

                      <label className={styles.toggle}>
                        <input
                          checked={item.available}
                          type="checkbox"
                          onChange={(event) =>
                            updateItem(item.id, "available", event.target.checked)
                          }
                        />
                        <span>{item.available ? "Disponible" : "No disponible"}</span>
                      </label>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </aside>

      <div className={styles.previewWrap}>
        <MenuPreview data={data} />
      </div>

      {isPublishNoticeOpen ? (
        <div
          aria-hidden="true"
          className={styles.noticeBackdrop}
          onClick={() => setIsPublishNoticeOpen(false)}
        >
          <div
            aria-labelledby="publish-notice-title"
            aria-modal="true"
            className={styles.noticeDialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <p className={styles.noticeEyebrow}>Demo interactiva</p>
            <h2 className={styles.noticeTitle} id="publish-notice-title">
              Aca se actualizaria tu menu.
            </h2>
            <p className={styles.noticeText}>
              Este es el punto donde se publicaria o actualizaria el menu que despues veria el
              cliente.
            </p>
            <p className={styles.noticeText}>
              Por cuestiones de practicidad, y porque esta experiencia esta pensada como demo, no
              podemos publicar ni actualizar este menu desde aqui.
            </p>
            <div className={styles.noticeActions}>
              <button
                className={styles.button}
                onClick={() => setIsPublishNoticeOpen(false)}
                type="button"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
