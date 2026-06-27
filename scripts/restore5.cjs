const fs = require('fs');
const pg = require('C:\\Users\\zhang\\OneDrive\\桌面\\file\\zhixunhub\\node_modules\\.pnpm\\pg@8.20.0\\node_modules\\pg');
const { Client } = pg;

const sql = fs.readFileSync('backup_unix.sql', 'utf8');
const url = 'postgresql://postgres:ZVinocANJhCNjnfOjeVvceOdoFtkwOok@reseau.proxy.rlwy.net:40240/railway';

(async () => {
  const c = new Client({ connectionString: url });
  await c.connect();
  
  // Parse SQL into statements by finding top-level semicolons
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDollarTag = null;
  let inLineComment = false;
  let inBlockComment = false;
  
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1] || '';
    
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    
    current += ch;
    
    if (inDollarTag) {
      if (ch === '$' && sql.slice(i - inDollarTag.length, i + 1) === '$' + inDollarTag + '$') {
        inDollarTag = null;
      }
    } else if (inSingleQuote) {
      if (ch === "'" && next === "'") {
        current += next;
        i++;
      } else if (ch === "'") {
        inSingleQuote = false;
      }
    } else if (ch === '-' && next === '-') {
      inLineComment = true;
      // Remove the -- from current
      current = current.slice(0, -2);
    } else if (ch === '/' && next === '*') {
      inBlockComment = true;
      current = current.slice(0, -2);
    } else if (ch === '$') {
      let tag = '';
      for (let j = i + 1; j < sql.length; j++) {
        if (sql[j] === '$') {
          inDollarTag = tag;
          i = j;
          break;
        }
        if (!/[a-zA-Z_]/.test(sql[j])) break;
        tag += sql[j];
      }
    } else if (ch === "'") {
      inSingleQuote = true;
    } else if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
    }
  }
  
  if (current.trim()) statements.push(current.trim());
  
  // Drop existing tables first
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
    try {
      await c.query(d);
    } catch (e) {
      // ignore drop errors
    }
  }
  console.log('Dropped existing tables');
  
  console.log(`Parsed ${statements.length} statements`);
  
  let success = 0;
  let errors = [];
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.startsWith('--')) {
      success++;
      continue;
    }
    try {
      await c.query(stmt);
      success++;
    } catch (e) {
      console.log(`Statement ${i + 1} failed (after ${success} OK): ${e.message.slice(0, 300)}`);
      console.log('SQL:', stmt.slice(0, 200));
      errors.push({ i: i + 1, msg: e.message.slice(0, 300) });
      break;
    }
  }
  
  console.log(`Done: ${success} statements executed`);
  await c.end();
})();
