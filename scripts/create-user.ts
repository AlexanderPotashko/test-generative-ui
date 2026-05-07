/**
 * Create a new user
 * Usage: npx tsx scripts/create-user.ts <email> <name> <password>
 * Example: npx tsx scripts/create-user.ts john@example.com "John Doe" mypassword123
 */
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  const [email, name, password] = process.argv.slice(2);

  if (!email || !name || !password) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> <name> <password>");
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    console.error(`User with email "${email}" already exists`);
    process.exit(1);
  }

  const id = globalThis.crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({ id, email, name, passwordHash });

  console.log(`✓ User created:`);
  console.log(`  ID:    ${id}`);
  console.log(`  Email: ${email}`);
  console.log(`  Name:  ${name}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
