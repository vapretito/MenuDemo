type RestaurantLoginPageProps = {
    params: Promise<{
      slug: string;
    }>;
  };
  
  export default async function RestaurantLoginPage({
    params,
  }: RestaurantLoginPageProps) {
    const { slug } = await params;
  
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <section style={{ display: "grid", gap: "1rem", maxWidth: 420, padding: 24 }}>
          <h1>Ingresar a {slug}</h1>
          <input placeholder="Email" />
          <input placeholder="Contraseña" type="password" />
          <button type="button">Entrar al panel</button>
        </section>
      </main>
    );
  }