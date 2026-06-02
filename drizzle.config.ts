import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.DB_FILE_NAME ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;
const isCloudDatabase = Boolean(process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL);

export default defineConfig(
  isCloudDatabase
    ? {
        schema: "./db/schema.ts",
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: {
          url: databaseUrl,
          authToken
        }
      }
    : {
        schema: "./db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: {
          url: databaseUrl
        }
      }
);
