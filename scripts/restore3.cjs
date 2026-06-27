const fs = require('fs');
const pg = require('C:\\Users\\zhang\\OneDrive\\桌面\\file\\zhixunhub\\node_modules\\.pnpm\\pg@8.20.0\\node_modules\\pg');
const { Client } = pg;

const sql = fs.readFileSync('backup_unix.sql', 'utf8');
const url = 'postgresql://postgres:ZVinocANJhCNjnfOjeVvceOdoFtkwOok@reseau.proxy.rlwy.net:40240/railway';

(async () => {
  const c = new Client({ connectionString: url });
  await c.connect();
  
  for (let pos = 0; pos < sql.length; pos += 500) {
    const chunk = sql.slice(pos, pos + 500);
    try {
      await c.query(chunk);
      console.log(`OK at ${pos}`);
    } catch (e) {
      console.log(`ERR at ${pos}: ${e.message.slice(0, 200)}`);
      console.log('Context:', chunk.slice(0, 100).replace(/\n/g, '\\n'));
      break;
    }
  }
  
  await c.end();
  console.log('Done');
})();
