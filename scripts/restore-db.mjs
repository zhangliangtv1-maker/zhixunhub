import { readFileSync } from "fs";
import pg from "pg";
const { Client } = pg;

const sql = readFileSync("backup.sql", "utf8");
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(sql);
await client.end();
console.log("Database restored successfully");
