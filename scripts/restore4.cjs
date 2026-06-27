const fs = require('fs');
const pg = require('C:\\Users\\zhang\\OneDrive\\桌面\\file\\zhixunhub\\node_modules\\.pnpm\\pg@8.20.0\\node_modules\\pg');
const { Client } = pg;

const sql = fs.readFileSync('backup_unix.sql', 'utf8');
const url = 'postgresql://postgres:ZVinocANJhCNjnfOjeVvceOdoFtkwOok@reseau.proxy.rlwy.net:40240/railway';

(async () => {
  const c = new Client({ connectionString: url });
  await c.connect();
  
  const stmts = sql.split(';\n');
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i].trim();
    if (!stmt || stmt.startsWith('--')) continue;
    try {
      await c.query(stmt + ';');
    } catch (e) {
      console.log(`Stmt ${i}:`, e.message.slice(0, 300));
      console.log('SQL:', stmt.slice(0, 200));
      break;
    }
  }
  
  await c.end();
  console.log('Done');
})();
