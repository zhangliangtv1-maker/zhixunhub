import { Router } from "express";
import { db, articlesTable, commentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-3.1-flash-lite"];

function isChinese(text: string | null | undefined): boolean {
  if (!text || text.length < 10) return false;
  const sample = text.slice(0, 300);
  const zhCount = [...sample].filter(c => c >= "\u4e00" && c <= "\u9fff").length;
  return zhCount >= 8;
}

async function geminiPost(prompt: string): Promise<string | null> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) return null;
  for (const model of GEMINI_MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
          }),
        },
      );
      if (!r.ok) continue;
      const data = await r.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text && text.length > 30) return text;
    } catch { /* try next model */ }
  }
  return null;
}

function parseJson(raw: string): Record<string, string> | null {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as Record<string, string>;
  } catch { /* fall through */ }
  return null;
}

async function reprocessArticle(title: string, content: string, summary: string) {
  const prompt = `你是智讯 Hub 的首席科技编辑。请将以下科技文章转化为中文内参，返回纯 JSON 对象。

原文标题：${title}
原文摘要：${summary.slice(0, 500)}
原文正文：
${content.slice(0, 5000)}

返回格式（纯 JSON，禁止输出 markdown 代码块）：
{"title":"完整的中文标题，整句必须是中文，可保留品牌名/产品名等专有名词，但动词/名词必须翻译为中文","summary":"200字左右的中文摘要，涵盖核心事件、关键数据和市场意义","content":"400-600字的中文深度拆解，覆盖背景来龙去脉、核心事件细节、行业影响与深层逻辑，连续段落，不加分节标题，保留英文专有名词","category":"以下之一：AI / Technology / Business / Security / Health / Policy / Space"}

强制规则：1. title 必须是地道中文句子结构 2. summary 和 content 全部用中文 3. content 必须是深度分析不是逐句翻译 4. 输出纯 JSON 不加 markdown 格式`;

  const raw = await geminiPost(prompt);
  if (!raw) return null;
  return parseJson(raw);
}

async function reprocessComment(title: string, summary: string): Promise<string | null> {
  const prompt = `你是智讯 Hub 首席分析师，以犀利著称，擅长在科技新闻背后挖掘别人看不见的产业逻辑。\n\n请针对以下新闻，写一段100到150字的中文锐评。必须严格按照以下三层结构展开（但不要写标题或分节符号，直接写成一整段流畅的中文）：\n1. 现象分析：这件事的本质是什么，不要复述新闻，要给出你的判断\n2. 行业影响：对竞争格局、上下游、或资本市场意味着什么\n3. 独家洞察：给出一个旁人未必想到的预判或警示\n\n语气要求：直接、锐利、有立场，敢于给出明确观点，杜绝"值得关注""仍需观察"之类的废话套话。可保留公司名、人名等英文专有名词。开头直接进入正文，不要任何前缀。字数严格控制在100到150字之间，句子必须写完整，不得截断。\n\n标题：${title}\n摘要：${summary.slice(0, 300)}`;
  return await geminiPost(prompt);
}

let _fixCommentsRunning = false;

async function runFixCommentsInBackground(): Promise<void> {
  if (_fixCommentsRunning) return;
  _fixCommentsRunning = true;
  try {
    const articles = await db.select().from(articlesTable);
    logger.info({ total: articles.length }, "fix-comments background started");
    let done = 0;
    for (const art of articles) {
      const commentText = await reprocessComment(art.title ?? "", art.summary ?? "");
      if (commentText) {
        await db.delete(commentsTable).where(eq(commentsTable.articleId, art.id));
        await db.insert(commentsTable).values({
          articleId: art.id,
          commenterName: "智讯 Hub 首席分析师",
          content: commentText,
        });
        done++;
        logger.info({ id: art.id, done, total: articles.length }, "fix-comments: updated");
      }
      await new Promise(r => setTimeout(r, 1_200));
    }
    logger.info({ done, total: articles.length }, "fix-comments background complete");
  } finally {
    _fixCommentsRunning = false;
  }
}

// Tracks whether a background fix is already running
let _fixRunning = false;

async function runFixInBackground(): Promise<void> {
  if (_fixRunning) return;
  _fixRunning = true;

  try {
    const articles = await db.select().from(articlesTable);
    const english = articles.filter(a => !isChinese(a.content) || !isChinese(a.title));
    logger.info({ total: articles.length, toFix: english.length }, "admin fix-chinese background started");

    let done = 0;
    for (const art of english) {
      const processed = await reprocessArticle(art.title ?? "", art.content ?? "", art.summary ?? "");
      if (!processed) { logger.warn({ id: art.id }, "fix: gemini returned null"); continue; }

      const validCategories = ["AI","Technology","Business","Security","Health","Policy","Space"];
      const category = validCategories.includes(processed["category"] ?? "") ? processed["category"] : "Technology";

      await db.update(articlesTable).set({
        title:    processed["title"]   ?? art.title,
        summary:  processed["summary"] ?? art.summary,
        content:  processed["content"] ?? art.content,
        category: category as typeof art.category,
      }).where(eq(articlesTable.id, art.id));

      const existing = await db.select().from(commentsTable).where(eq(commentsTable.articleId, art.id));
      if (existing.length === 0 || !isChinese(existing[0]?.content)) {
        const commentText = await reprocessComment(
          processed["title"] ?? art.title ?? "",
          processed["summary"] ?? art.summary ?? "",
        );
        if (commentText) {
          await db.delete(commentsTable).where(eq(commentsTable.articleId, art.id));
          await db.insert(commentsTable).values({
            articleId: art.id,
            commenterName: "智讯 Hub 首席分析师",
            content: commentText,
          });
        }
      }

      done++;
      logger.info({ id: art.id, done, total: english.length, title: (processed["title"] ?? "").slice(0, 40) }, "fix: article translated");
      // Rate-limit buffer between Gemini calls
      await new Promise(r => setTimeout(r, 1_200));
    }

    logger.info({ done, total: english.length }, "admin fix-chinese background complete");
  } finally {
    _fixRunning = false;
  }
}

// POST /api/admin/fix-comments — regenerates ALL commentaries with new prompt
router.post("/admin/fix-comments", (req, res) => {
  const body = req.body as Record<string, string>;
  const secret = (req.headers["x-admin-secret"] as string | undefined) ?? body["secret"];
  if (secret !== "zhixun-fix-2026") {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  if (_fixCommentsRunning) {
    res.json({ message: "already_running" });
    return;
  }
  runFixCommentsInBackground().catch(err => logger.error({ err }, "fix-comments background crashed"));
  res.json({ message: "started — regenerating all commentaries in background" });
});

// POST /api/admin/fix-chinese — triggers background translation, returns immediately
router.post("/admin/fix-chinese", (req, res) => {
  const body = req.body as Record<string, string>;
  const secret = (req.headers["x-admin-secret"] as string | undefined) ?? body["secret"];
  if (secret !== "zhixun-fix-2026") {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  if (_fixRunning) {
    res.json({ message: "already_running" });
    return;
  }

  // Fire-and-forget: respond immediately, translate in background
  runFixInBackground().catch(err => logger.error({ err }, "fix-chinese background crashed"));
  res.json({ message: "started — check server logs for progress" });
});

// POST /api/admin/fix-categories — merge removed categories into canonical ones
router.post("/admin/fix-categories", async (req, res) => {
  const secret = (req.headers["x-admin-secret"] as string | undefined);
  if (secret !== "zhixun-fix-2026") { res.status(403).json({ error: "forbidden" }); return; }
  const { sql } = await import("drizzle-orm");
  const r1 = await db.execute(sql`UPDATE articles SET category = 'Business' WHERE category IN ('Startups','Finance','Science')`);
  const r2 = await db.execute(sql`UPDATE articles SET category = 'Technology' WHERE category = 'Science'`);
  res.json({ merged: (r1.rowCount ?? 0) + (r2.rowCount ?? 0) });
});

// DELETE /api/admin/articles/:id — delete a single article by id
router.delete("/admin/articles/:id", async (req, res) => {
  const secret = (req.headers["x-admin-secret"] as string | undefined);
  if (secret !== "zhixun-fix-2026") {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const id = parseInt(req.params["id"] ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "invalid id" }); return; }
  await db.delete(commentsTable).where(eq(commentsTable.articleId, id));
  const deleted = await db.delete(articlesTable).where(eq(articlesTable.id, id)).returning({ id: articlesTable.id });
  if (deleted.length === 0) { res.status(404).json({ error: "not found" }); return; }
  logger.info({ id }, "admin: article deleted");
  res.json({ deleted: id });
});

// POST /api/admin/delete-old — delete articles whose source_url contains old year patterns
router.post("/admin/delete-old", async (req, res) => {
  const secret = (req.headers["x-admin-secret"] as string | undefined);
  if (secret !== "zhixun-fix-2026") {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  const { sql, inArray } = await import("drizzle-orm");
  const old = await db.select({ id: articlesTable.id, title: articlesTable.title })
    .from(articlesTable)
    .where(sql`${articlesTable.sourceUrl} ~ '/202[0-4]/'`);
  if (old.length === 0) { res.json({ deleted: 0, articles: [] }); return; }
  const ids = old.map(a => a.id);
  await db.delete(commentsTable).where(inArray(commentsTable.articleId, ids));
  await db.delete(articlesTable).where(inArray(articlesTable.id, ids));
  logger.info({ count: ids.length, ids }, "admin: old articles deleted");
  res.json({ deleted: ids.length, articles: old.map(a => ({ id: a.id, title: (a.title ?? "").slice(0, 60) })) });
});

export default router;
