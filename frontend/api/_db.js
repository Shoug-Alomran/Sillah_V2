import mysql from "mysql2/promise";

let pool;

export function getPool() {
  if (pool) return pool;

  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  const missing = [];
  if (!host) missing.push("DB_HOST");
  if (!user) missing.push("DB_USER");
  if (!password) missing.push("DB_PASSWORD");
  if (!database) missing.push("DB_NAME");
  if (missing.length) {
    throw new Error(`Missing database env vars: ${missing.join(", ")}`);
  }

  if (host === "localhost" || host === "127.0.0.1") {
    throw new Error(
      "DB_HOST points to localhost. Vercel cannot connect to your local MySQL. Use a hosted MySQL endpoint."
    );
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 10,
    waitForConnections: true
  });

  return pool;
}
