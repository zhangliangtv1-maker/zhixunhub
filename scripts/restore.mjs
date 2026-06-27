import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("C:\\Users\\zhang\\OneDrive\\桌面\\file\\zhixunhub\\node_modules\\.pnpm\\pg@8.20.0\\node_modules\\pg");

const sql = readFileSync("backup_clean2.sql", "utf8");
const statements = sql.split(";").filter(s => s.trim());

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i].trim();
  if (!stmt) continue;
  try {
    const client = new Client({ connectionString: "postgresql://postgres:ZVinocANJhCNjnfOjeVvceOdoFtkwOok@reseau.proxy.rlwy.net:40240/railway" });
    await client.connect();
    await client.query(stmt + ";");
    await client.end();
  } catch (err) {
    console.error(`Statement ${i + 1} failed:`, err.message.substring(0, 200));
    break;
  }
}
console.log("Done");
