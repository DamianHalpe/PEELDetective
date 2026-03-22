/**
 * Pre-migration reconciliation script.
 *
 * Problem: `db:push` applies schema changes directly without recording them
 * in the `__drizzle_migrations` table. If `db:push` was ever run against a
 * database (e.g. production Neon), subsequent `drizzle-kit migrate` calls will
 * try to re-apply those migrations and fail with "column/table already exists".
 *
 * Fix: for each migration whose hash is NOT yet in `__drizzle_migrations`, check
 * whether the schema changes are already present in the database. If they are,
 * insert the hash so `drizzle-kit migrate` recognises the migration as applied
 * and skips it.
 *
 * This script is intentionally idempotent and safe to run on every deploy.
 */

import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function columnExists(client, table, column) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return (res.rowCount ?? 0) > 0;
}

async function tableExists(client, table) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return (res.rowCount ?? 0) > 0;
}

async function migrationTableExists(client) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'`
  );
  return (res.rowCount ?? 0) > 0;
}

async function hashAlreadyRecorded(client, hash) {
  const res = await client.query(
    `SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1`,
    [hash]
  );
  return (res.rowCount ?? 0) > 0;
}

async function recordMigration(client, hash, createdAt) {
  await client.query(
    `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [hash, createdAt]
  );
}

function fileHash(filePath) {
  const content = readFileSync(filePath, "utf8");
  return createHash("sha256").update(content).digest("hex");
}

// ---------------------------------------------------------------------------
// Per-migration schema checks
// Returns true if the schema changes for that migration already exist in the DB.
// ---------------------------------------------------------------------------

async function schemaAlreadyApplied(client, tag) {
  switch (tag) {
    case "0004_parched_rachel_grey":
      // Adds `banned` column to `user`
      return columnExists(client, "user", "banned");

    case "0005_married_nomad":
      // Adds subscription columns + subscription_history table
      return (
        (await tableExists(client, "subscription_history")) &&
        (await columnExists(client, "user", "subscribed"))
      );

    default:
      // Unknown migration — don't auto-mark; let drizzle-kit handle it normally
      return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const url =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

  if (!url) {
    console.log(
      "[pre-migrate] No POSTGRES_URL set — skipping reconciliation."
    );
    return;
  }

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();

  try {
    // If the drizzle migrations table doesn't exist yet this is a fresh DB —
    // nothing to reconcile; let drizzle-kit create the table and apply all.
    if (!(await migrationTableExists(client))) {
      console.log(
        "[pre-migrate] Migration table does not exist yet — skipping reconciliation."
      );
      return;
    }

    const journal = JSON.parse(
      readFileSync(join(ROOT, "drizzle/meta/_journal.json"), "utf8")
    );

    for (const entry of journal.entries) {
      const sqlPath = join(ROOT, `drizzle/${entry.tag}.sql`);
      const hash = fileHash(sqlPath);

      if (await hashAlreadyRecorded(client, hash)) {
        // Already tracked — nothing to do.
        continue;
      }

      // Migration not tracked — check if schema is already in the DB.
      if (await schemaAlreadyApplied(client, entry.tag)) {
        console.log(
          `[pre-migrate] ${entry.tag}: schema already applied — marking migration as recorded.`
        );
        await recordMigration(client, hash, entry.when);
      }
    }

    console.log("[pre-migrate] Reconciliation complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[pre-migrate] Error:", err.message);
  // Exit 0 intentionally — don't block the build on reconciliation failure;
  // drizzle-kit migrate will surface the real error if there is one.
  process.exit(0);
});
