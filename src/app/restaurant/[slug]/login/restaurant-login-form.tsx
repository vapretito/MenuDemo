"use client";

import { useState } from "react";
import styles from "./page.module.css";

type RestaurantLoginFormProps = {
  restaurantName: string;
  restaurantSlug: string;
  restaurantStatus: string;
};

export function RestaurantLoginForm({
  restaurantName,
  restaurantSlug,
  restaurantStatus,
}: RestaurantLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/restaurant-auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: restaurantSlug,
          email,
          password,
        }),
      });

      const rawResponse = await response.text();

      let data: {
        ok?: boolean;
        redirectTo?: string;
        error?: string;
      } = {};

      try {
        data = rawResponse ? JSON.parse(rawResponse) : {};
      } catch {
        throw new Error(
          `La API no devolvió JSON. Status: ${response.status}.`
        );
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo ingresar al panel.");
      }

      window.location.href = data.redirectTo ?? "/admin";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo ingresar al panel."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={styles.loginPanel}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <span className={styles.eyebrow}>Ingresar</span>
          <h2>Acceso del restaurante</h2>
          <p>
            Entrá con las credenciales asignadas para administrar el menú de{" "}
            <strong>{restaurantName}</strong>.
          </p>
        </div>

        {restaurantStatus !== "ACTIVE" && restaurantSlug !== "demo" ? (
          <div className={styles.demoBox}>
            <span>Restaurante pendiente</span>
            <p>
              Este restaurante todavía no está activo. Completá el pago antes de
              ingresar al panel.
            </p>
          </div>
        ) : null}

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            login();
          }}
        >
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@restaurante.com"
              type="email"
              value={email}
            />
          </label>

          <label>
            <span>Contraseña</span>
            <input
              autoComplete="current-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />
          </label>

          {error ? <p className={styles.errorBox}>{error}</p> : null}

          <button
            className={styles.primaryButton}
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Ingresando..." : "Entrar al panel"}
          </button>
        </form>
      </div>
    </section>
  );
}