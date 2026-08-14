const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Client } = require("pg");

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DIRECT_URL or DATABASE_URL is not set in environment.");
  process.exit(1);
}

console.log("Connecting to Supabase PostgreSQL database...");

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigrations() {
  try {
    await client.connect();
    console.log("Connected successfully!");

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const { rows: executedRows } = await client.query(
      `SELECT version FROM public.schema_migrations`
    );
    const executedVersions = new Set(executedRows.map((r) => r.version));

    const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} SQL migration files:`, migrationFiles);

    for (const file of migrationFiles) {
      if (executedVersions.has(file)) {
        console.log(`Skipping already executed migration: ${file}`);
        continue;
      }

      console.log(`Executing migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING`,
          [file]
        );
        console.log(`Successfully executed: ${file}`);
      } catch (migrationErr) {
        // If policy or table already exists error, record as executed and proceed
        if (
          migrationErr.code === "42710" || // duplicate_object (policy/type already exists)
          migrationErr.message.includes("already exists")
        ) {
          console.warn(`Object in ${file} already exists, marking as executed.`);
          await client.query(
            `INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING`,
            [file]
          );
        } else {
          throw migrationErr;
        }
      }
    }

    console.log("\nALL DATABASE MIGRATIONS PROCESSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Migration error:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
