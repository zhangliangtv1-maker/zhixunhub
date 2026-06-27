const { Client } = require('C:\\Users\\zhang\\OneDrive\\桌面\\file\\zhixunhub\\node_modules\\.pnpm\\pg@8.20.0\\node_modules\\pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'backup.sql'), 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('Database restored successfully');
}

main().catch(err => {
  console.error('Restore failed:', err);
  process.exit(1);
});
