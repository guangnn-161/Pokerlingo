import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL is required in production.");
}
const client = postgres(connectionString ?? "postgres://postgres:postgres@localhost:5432/pokerlingo", {
  prepare: false, max: 1
});
export const db = drizzle(client, { schema });
export { schema };