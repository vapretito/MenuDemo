import Link from "next/link";
import { AdminPanel } from "@/components/admin-panel";

export default function AdminPage() {
  return (
    <main className="editorial-page">
      <section className="page-intro">
        <div>
          <p className="kicker">Panel admin</p>
          <h1 className="display-title small">
            Editor visual para platos, precios, categorias y personalidad del menu.
          </h1>
        </div>
        <div className="editorial-columns">
          <p>
            El admin puede modificar contenido y direccion visual desde una sola vista.
            La previsualizacion responde en vivo para validar si la identidad del
            restaurante se siente propia.
          </p>
          <p>
            En esta primera etapa los cambios viven en memoria del navegador. La
            arquitectura ya queda lista para conectar base de datos, auth y carrito mas
            adelante.
          </p>
        </div>
      </section>

      <div className="top-nav">
        <Link className="inline-link" href="/">
          Volver a la landing
        </Link>
        <Link className="inline-link" href="/demo">
          Ver demo publica
        </Link>
      </div>

      <AdminPanel />
    </main>
  );
}
