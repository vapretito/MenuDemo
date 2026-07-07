import "dotenv/config";
import { defineConfig } from "prisma/config";

const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "Falta una URL de base de datos para Prisma. Configura DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING o DATABASE_URL.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
