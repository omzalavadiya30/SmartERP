require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
let pool;
let embedded;

async function database() {
  if (process.env.DATABASE_URL) {
    pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
    return pool;
  }
  if (process.env.PGLITE_PATH && process.env.NODE_ENV !== "production") {
    const { PGlite } = require("@electric-sql/pglite");
    embedded ??= new PGlite(process.env.PGLITE_PATH);
    return embedded;
  }
  throw new Error("Configure DATABASE_URL or a development PGLITE_PATH.");
}
async function transaction(work) {
  const db = await database();
  if (db === embedded) return db.transaction(work);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
async function migrate() {
  const db = await database();
  await transaction(async (client) => {
    for (const file of ["schema.sql", "erp.sql"]) {
      const sql = fs.readFileSync(path.join(__dirname, "../../database", file), "utf8");
      if (db === embedded) await client.exec(sql);
      else await client.query(sql);
    }
  });
}
async function close() {
  if (pool) await pool.end();
  if (embedded) await embedded.close();
}
module.exports = { database, transaction, migrate, close };
if (require.main === module)
  migrate()
    .then(close)
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
