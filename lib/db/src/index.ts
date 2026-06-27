import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected pg pool error (non-fatal):", err.message);
});

export const db = drizzle(pool, { schema });

const TRANSIENT_CODES = new Set(["57P01", "57P02", "57P03", "08006", "08001", "08004", "ECONNRESET", "ECONNREFUSED"]);

function isTransient(err: unknown): boolean {
  if (err instanceof Error) {
    const pg = err as Error & { code?: string };
    if (pg.code && TRANSIENT_CODES.has(pg.code)) return true;
    if (err.message.includes("terminating connection")) return true;
    if (err.message.includes("Connection terminated")) return true;
  }
  return false;
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 300): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isTransient(err) && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export * from "./schema";
