import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
async function main() {
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@pokerlingo.local"));
  if (!admin) await db.insert(users).values({ id: "dev-admin", email: "admin@pokerlingo.local", name: "Development Admin", role: "admin" });
}
main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });