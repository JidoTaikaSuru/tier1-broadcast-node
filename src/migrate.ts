import postgres from "postgres";
import dotenv from "dotenv"
dotenv.config()

const runUpMigrations = async () => {
    console.log("Running migration script...")

    // Don't fetch this from config.js because this script is meant to be run standalone
    const constr = process.env.DATABASE_URL
    if (!constr) {
        throw new Error("Missing DATABASE_URL envvar")
    }
    const sql = postgres(constr)

    console.log("Creating published_data table...")
    await sql`CREATE TABLE IF NOT EXISTS "published_data"
              (
                  id                uuid PRIMARY KEY                  DEFAULT gen_random_uuid(), --Use uuid here since the ID will be the connection request ID later
                  user_did          text                     null,
                  user_jwt          text                     null,
                  user_pow_solution text                     null,
                  pow_challenge     text                     null,
                  tier2_origin_did  text                     null,
                  tier1_origin_did  text                     null,
                  message           text                     null,
                  created_at        timestamp with time zone not null default now()
              );
    `
    // await sql`CREATE INDEX IF NOT EXISTS "published_data_user_did_idx" ON "published_data" (user_did);`
    console.log("Created published_data table")
}

const runDownMigrations = async () => {
    console.log("Running migration script...")

    // Don't fetch this from config.js because this script is meant to be run standalone
    const constr = process.env.DATABASE_URL
    if (!constr) {
        throw new Error("Missing DATABASE_URL envvar")
    }
    const sql = postgres(constr)

    console.log("Dropping published_data table...")
    await sql`DROP TABLE IF EXISTS "published_data" CASCADE;`
    console.log("Dropped published_data table")
}
await runDownMigrations()
await runUpMigrations()
console.log("Finished running migrations, you must now run `./generate-schema.sh` to generate typescript types + ORM")
process.exit(0)
