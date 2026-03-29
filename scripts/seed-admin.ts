#!/usr/bin/env npx tsx
/**
 * Creates a super-admin account in the database.
 * Run with: pnpm run seed:admin
 */

// Load .env before importing anything that needs env vars
import "dotenv/config";

import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { user } from "../src/lib/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "admin@peeldetective.com";
const ADMIN_PASSWORD = "Admin@12345!";
const ADMIN_NAME = "Super Admin";

async function main() {
  console.log("Creating super-admin account...\n");

  // Check if admin already exists
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    const u = existing[0]!;
    if (u.role === "super-admin") {
      console.log(`✓ Super-admin account already exists: ${ADMIN_EMAIL}`);
    } else {
      // Upgrade existing user to super-admin
      await db
        .update(user)
        .set({ role: "super-admin" })
        .where(eq(user.email, ADMIN_EMAIL));
      console.log(`✓ Upgraded existing user to super-admin: ${ADMIN_EMAIL}`);
    }
    process.exit(0);
  }

  // Create user via Better Auth (handles password hashing)
  const response = await auth.api.signUpEmail({
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
    },
  });

  if (!response?.user?.id) {
    console.error("✗ Failed to create admin user");
    process.exit(1);
  }

  // Set role to super-admin
  await db
    .update(user)
    .set({ role: "super-admin", emailVerified: true })
    .where(eq(user.id, response.user.id));

  console.log("✓ Super-admin account created successfully!\n");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Role:     super-admin`);
  console.log("\n⚠  Change the password after first login!");

  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Error:", err);
  process.exit(1);
});
