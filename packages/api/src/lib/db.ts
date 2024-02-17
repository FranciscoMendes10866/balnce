import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

import * as schema from "../entities";

export type DbClient = BunSQLiteDatabase<typeof schema>;

export const db = drizzle(new Database("local.db"), {
  schema,
}) satisfies DbClient;
