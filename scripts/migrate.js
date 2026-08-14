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

    const migrationsDir = path.resolve(process.cwd(), "supabase/migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} SQL migration files:`, migrationFiles);

    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      await client.query(sql);
      console.log(`Successfully executed: ${file}`);
    }

    console.log("\nALL DATABASE MIGRATIONS EXECUTED SUCCESSFULLY!");
  } catch (err) {
    console.error("Migration error:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
