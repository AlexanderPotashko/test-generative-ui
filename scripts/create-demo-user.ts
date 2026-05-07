/**
 * Creates the demo user if not exists.
 * Run: npx tsx scripts/create-demo-user.ts
 */
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

async function main() {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  const email = "demo@example.com";
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    console.log("Demo user already exists:", existing.id);
    return;
  }

  const passwordHash = await bcrypt.hash("demo1234", 12);
  const id = randomUUID();
  await db.insert(users).values({ id, email, name: "Demo User", passwordHash });
  console.log("✓ Created demo user:", id);
}

main().catch((e) => { console.error(e); process.exit(1); });
