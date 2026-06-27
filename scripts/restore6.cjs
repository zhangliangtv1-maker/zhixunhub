const fs = require('fs');
const path = require('path');
const { Client } = require('C:\\Users\\zhang\\OneDrive\\桌面\\file\\zhixunhub\\node_modules\\.pnpm\\pg@8.20.0\\node_modules\\pg');

const sql = fs.readFileSync(path.join(__dirname, '..', 'backup_unix.sql'), 'utf8');
const url = process.env.DATABASE_URL || 'postgresql://postgres:ZVinocANJhCNjnfOjeVvceOdoFtkwOok@reseau.proxy.rlwy.net:40240/railway';

function escapeLiteral(val) {
  if (val === null || val === undefined || val === '\\N') return 'NULL';
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

function parseSQL(sql) {
  const blocks = [];
  let i = 0;

  while (i < sql.length) {
    // Skip whitespace
    while (i < sql.length && /\s/.test(sql[i])) i++;
    if (i >= sql.length) break;

    // Block comment
    if (sql[i] === '/' && sql[i+1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      if (end === -1) break;
      i = end + 2;
      continue;
    }

    // Line comment
    if (sql[i] === '-' && sql[i+1] === '-') {
      const end = sql.indexOf('\n', i + 2);
      if (end === -1) break;
      i = end + 1;
      continue;
    }

    // psql meta-command (starts with \)
    if (sql[i] === '\\') {
      const end = sql.indexOf('\n', i + 1);
      if (end === -1) break;
      i = end + 1;
      continue;
    }

    // Check for COPY ... FROM stdin;
    const copyMatch = sql.slice(i).match(/^COPY\s+(\S+)\s+\(([^)]+)\)\s+FROM\s+stdin;?/i);
    if (copyMatch) {
      const fullMatch = copyMatch[0];
      const tableName = copyMatch[1];
      const columns = copyMatch[2].split(',').map(c => c.trim());
      i += fullMatch.length;

      // Collect data lines until next SQL statement or empty line followed by non-data
      // Lines starting with digits are data, lines starting with \\N or quoted are data
      // Next SQL statement starts with a keyword (COPY, ALTER, CREATE, SELECT, etc.)
      const dataLines = [];
      let lineStart = i;

      // Find the next statement delimiter (semicolon) or next SQL command
      // Data ends when we encounter: a line starting with SQL keyword (COPY, ALTER, CREATE, SELECT, SET, --, etc.)
      // or EOF
      let searchEnd = sql.indexOf(';', i);
      if (searchEnd === -1) searchEnd = sql.length;

      // Actually, let's be smarter: look for the next COPY, ALTER, SELECT, SET statement
      // Data rows are between COPY and the next non-data line
      const nextStmt = sql.slice(i).search(/\n\s*(COPY\s|ALTER\s|CREATE\s|SELECT\s|DROP\s|INSERT\s|UPDATE\s|DELETE\s|GRANT\s|REVOKE\s|--)/i);
      
      if (nextStmt === -1) {
        // No more statements, rest is data
        const rest = sql.slice(i).trim();
        if (rest) dataLines.push(rest);
        i = sql.length;
      } else {
        const dataEnd = i + nextStmt;
        const rawData = sql.slice(i, dataEnd).trim();
        if (rawData) {
          dataLines.push(...rawData.split('\n'));
        }
        i = dataEnd;
      }

      // Filter out \. (psql end-of-data markers)
      const filteredData = dataLines.filter(l => l.trim() !== '\\.');
      blocks.push({ type: 'copy', table: tableName, columns, data: filteredData });
    } else {
      // Regular SQL statement
      let start = i;
      let inSQ = false;
      let inDQ = false;
      let inDollar = false;
      let dollarTag = '';

      while (i < sql.length) {
        const ch = sql[i];

        if (inDollar) {
          if (ch === '$' && sql.slice(i - dollarTag.length, i + 1) === '$' + dollarTag + '$') {
            inDollar = false;
          }
        } else if (inSQ) {
          if (ch === "'") {
            // Check for escaped quote
            if (sql[i+1] === "'") i++;
            else inSQ = false;
          }
        } else if (inDQ) {
          if (ch === '"') inDQ = false;
        } else if (ch === '$') {
          // Check for dollar quote
          let tag = '';
          for (let j = i + 1; j < sql.length; j++) {
            if (sql[j] === '$') {
              dollarTag = tag;
              inDollar = true;
              i = j;
              break;
            }
            if (!/[a-zA-Z_]/.test(sql[j])) break;
            tag += sql[j];
          }
        } else if (ch === "'") {
          inSQ = true;
        } else if (ch === '"') {
          inDQ = true;
        } else if (ch === ';') {
          i++;
          break;
        }
        i++;
      }

      const stmt = sql.slice(start, i).trim();
      if (stmt && !stmt.startsWith('--')) {
        blocks.push({ type: 'sql', sql: stmt });
      }
    }
  }
  return blocks.filter(b => !(b.type === 'sql' && /^\s*\\.*?/.test(b.sql)));
}

function copyToInserts(block) {
  const { table, columns, data } = block;
  const colList = columns.join(', ');
  const inserts = [];

  for (const line of data) {
    if (!line.trim()) continue;
    // Parse tab-separated values
    const values = line.split('\t');
    const escaped = values.map(v => escapeLiteral(v));
    inserts.push(`INSERT INTO ${table} (${colList}) VALUES (${escaped.join(', ')});`);
  }
  return inserts;
}

(async () => {
  const c = new Client({ connectionString: url });
  await c.connect();

  // Drop existing tables
  const dropStmts = [
    'DROP TABLE IF EXISTS public.view_events CASCADE',
    'DROP TABLE IF EXISTS public.comments CASCADE',
    'DROP TABLE IF EXISTS public.subscribers CASCADE',
    'DROP TABLE IF EXISTS public.articles CASCADE',
    'DROP SEQUENCE IF EXISTS public.view_events_id_seq CASCADE',
    'DROP SEQUENCE IF EXISTS public.comments_id_seq CASCADE',
    'DROP SEQUENCE IF EXISTS public.subscribers_id_seq CASCADE',
    'DROP SEQUENCE IF EXISTS public.articles_id_seq CASCADE',
  ];
  for (const d of dropStmts) {
    try { await c.query(d); } catch (e) {}
  }
  console.log('Dropped existing tables');

  const blocks = parseSQL(sql);
  console.log(`Parsed ${blocks.length} blocks`);
  const copyBlocks = blocks.filter(b => b.type === 'copy');
  console.log(`  ${copyBlocks.length} COPY blocks`);
  const stmtCount = blocks.filter(b => b.type === 'sql').length;
  console.log(`  ${stmtCount} SQL statements`);
  for (const cb of copyBlocks) {
    console.log(`  COPY ${cb.table}: ${cb.data.length} data rows`);
  }

  let success = 0;
  let totalStmts = 0;

  for (const block of blocks) {
    if (block.type === 'sql') {
      totalStmts++;
      try {
        await c.query(block.sql);
        success++;
      } catch (e) {
        console.log(`SQL statement ${totalStmts} failed: ${e.message.slice(0, 300)}`);
        console.log('SQL:', block.sql.slice(0, 200));
        break;
      }
    } else if (block.type === 'copy') {
      const inserts = copyToInserts(block);
      totalStmts += inserts.length;
      let ok = 0;
      for (const ins of inserts) {
        try {
          await c.query(ins);
          ok++;
        } catch (e) {
          console.log(`INSERT into ${block.table} failed: ${e.message.slice(0, 200)}`);
          console.log('SQL:', ins.slice(0, 150));
          break;
        }
      }
      success += ok;
      console.log(`  ${block.table}: inserted ${ok}/${inserts.length} rows`);
    }
  }

  console.log(`Done: ${success} statements executed out of ${totalStmts} total`);
  await c.end();
})();
