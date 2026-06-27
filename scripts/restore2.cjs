const fs = require('fs');
const pg = require('C:\\Users\\zhang\\OneDrive\\桌面\\file\\zhixunhub\\node_modules\\.pnpm\\pg@8.20.0\\node_modules\\pg');
const { Client } = pg;

const sql = fs.readFileSync('backup_unix.sql', 'utf8');

(async () => {
  const c = new Client({ connectionString: 'postgresql://postgres:ZVinocANJhCNjnfOjeVvceOdoFtkwOok@reseau.proxy.rlwy.net:40240/railway' });
  await c.connect();
  try {
    await c.query(sql.substring(0, 2000));
    console.log('First 2000 chars OK');
  } catch (e) {
    console.log('Error:', e.message);
  }
  await c.end();
})();
