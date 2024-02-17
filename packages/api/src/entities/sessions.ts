import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

import { users } from "./users";

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  expiresAt: integer("expires_at").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
});
