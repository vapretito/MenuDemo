import Link from "next/link";
import { MenuPreview } from "@/components/menu-preview";
import { initialMenuData } from "@/data/menu";

export default function DemoPage() {
  return (
    <main className="editorial-page">
      <section className="page-intro">
        <div>
          <p className="kicker">Demo publica</p>
          <h1 className="display-title small">
            Asi se veria el menu visual para un restaurante real.
          </h1>
        </div>
        <div className="editorial-columns">
          <p>
            Esta pagina existe separada de la landing para explicar y mostrar la
            experiencia. El visitante entiende la propuesta y despues navega la demo
            como si estuviera frente a una carta digital con personalidad.
          </p>
          <p>
            Por ahora todo es visual: sin carrito, sin checkout, sin friccion. El foco
            esta en presentar platos, categorias y atmosfera.
          </p>
        </div>
      </section>

      <div className="top-nav">
        <Link className="inline-link" href="/">
          Volver a la landing
        </Link>
        <Link className="inline-link" href="/admin">
          Personalizar demo
        </Link>
      </div>

      <MenuPreview data={initialMenuData} mode="full-page" />
    </main>
  );
}
