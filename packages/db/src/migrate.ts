import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";
async function main() { await migrate(db, { migrationsFolder: "drizzle" }); }
main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });