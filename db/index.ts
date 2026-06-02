import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.DB_FILE_NAME ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url: databaseUrl,
  authToken
});

export const db = drizzle(client, { schema });
export type Db = typeof db;
