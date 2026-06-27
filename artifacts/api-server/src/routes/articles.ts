import { Router } from "express";
import { db, articlesTable, commentsTable, viewEventsTable } from "@workspace/db";
import { eq, desc, asc, gt, lt, ilike, or, count, sql, SQL } from "drizzle-orm";
import {
  ListArticlesQueryParams,
  GetArticleParams,
  ListCommentsQueryParams,
} from "@workspace/api-zod";
import { serializeArticle, serializeComment } from "../lib/serialize";
import { logger } from "../lib/logger";

// ── Lazy-translation helpers ──────────────────────────────────────────────────

function hasChinese(text: string | null | undefined): boolean {
  if (!text || text.length < 5) return false;
  const zhCount = [...text.slice(0, 300)].filter(c => c >= "\u4e00" && c <= "\u9fff").length;
  return zhCount >= 8;
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

async function geminiCall(prompt: string): Promise<string | null> {
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
    } catch { /* try next */ }
  }
  return null;
}

function safeParseJson(raw: string): Record<string, string> | null {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) as Record<string, string> : null;
  } catch { return null; }
}

const VALID_CATEGORIES = ["AI","Technology","Startups","Business","Science","Security","Finance","Health","Policy","Space"] as const;

async function translateArticle(art: typeof articlesTable.$inferSelect): Promise<void> {
  const prompt = `你是智讯 Hub 的首席科技编辑。请将以下科技文章转化为中文内参，返回纯 JSON 对象。

原文标题：${art.title}
原文正文：
${(art.content ?? "").slice(0, 5000)}

返回格式（纯 JSON，禁止输出 markdown 代码块）：
{"title":"完整的中文标题，整句必须是中文，可保留品牌名/产品名等专有名词，动词/名词必须翻译为中文","summary":"200字左右的中文摘要，涵盖核心事件、关键数据和市场意义","content":"400-600字的中文深度拆解，覆盖背景来龙去脉、核心事件细节、行业影响与深层逻辑，连续段落，不加分节标题，保留英文专有名词","category":"以下之一：AI / Technology / Startups / Business / Science / Security / Finance / Health / Policy / Space"}

强制规则：1.title必须是地道中文句子结构 2.全部用中文 3.content是深度分析不是逐句翻译 4.输出纯JSON不加markdown`;

  const raw = await geminiCall(prompt);
  if (!raw) return;
  const parsed = safeParseJson(raw);
  if (!parsed) return;

  const category = VALID_CATEGORIES.includes(parsed["category"] as typeof VALID_CATEGORIES[number])
    ? parsed["category"] as typeof art.category
    : "Technology" as typeof art.category;

  await db.update(articlesTable).set({
    title:    parsed["title"]   ?? art.title,
    summary:  parsed["summary"] ?? art.summary,
    content:  parsed["content"] ?? art.content,
    category,
  }).where(eq(articlesTable.id, art.id));

  // Fix commentary if missing or English
  const existing = await db.select().from(commentsTable).where(eq(commentsTable.articleId, art.id)).limit(1);
  if (existing.length === 0 || !hasChinese(existing[0]?.content)) {
    const commentPrompt = `你是智讯 Hub 首席分析师，以犀利著称，擅长在科技新闻背后挖掘别人看不见的产业逻辑。\n\n请针对以下新闻，写一段100到150字的中文锐评。必须严格按照以下三层结构展开（但不要写标题或分节符号，直接写成一整段流畅的中文）：\n1. 现象分析：这件事的本质是什么，不要复述新闻，要给出你的判断\n2. 行业影响：对竞争格局、上下游、或资本市场意味着什么\n3. 独家洞察：给出一个旁人未必想到的预判或警示\n\n语气要求：直接、锐利、有立场，敢于给出明确观点，杜绝"值得关注""仍需观察"之类的废话套话。可保留公司名、人名等英文专有名词。开头直接进入正文，不要任何前缀。字数严格控制在100到150字之间，句子必须写完整，不得截断。\n\n标题：${parsed["title"] ?? art.title}\n摘要：${(parsed["summary"] ?? "").slice(0, 300)}`;
    const commentText = await geminiCall(commentPrompt);
    if (commentText) {
      await db.delete(commentsTable).where(eq(commentsTable.articleId, art.id));
      await db.insert(commentsTable).values({ articleId: art.id, commenterName: "智讯 Hub 首席分析师", content: commentText });
    }
  }

  logger.info({ id: art.id, title: (parsed["title"] ?? "").slice(0, 40) }, "article auto-translated");
}

const router = Router();

router.get("/articles", async (req, res) => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { category, limit = 20, offset = 0, search } = parsed.data;

  // Build raw-SQL conditions using alias 'a' to match the LATERAL JOIN query.
  // Using Drizzle ORM condition builders here generates "articles"."column"
  // which PostgreSQL rejects when the table is aliased as 'a'.
  const rawConditions: ReturnType<typeof sql>[] = [];
  if (category) rawConditions.push(sql`a.category = ${category}`);
  if (search) {
    const like = `%${search}%`;
    rawConditions.push(sql`(a.title ILIKE ${like} OR a.summary ILIKE ${like})`);
  }

  const whereRaw = rawConditions.length > 0
    ? rawConditions.reduce((acc, cond) => sql`${acc} AND ${cond}`)
    : undefined;

  // Drizzle ORM WHERE for the COUNT query (no alias, safe to use ORM builders)
  const ormConditions = [];
  if (category) ormConditions.push(eq(articlesTable.category, category));
  if (search) {
    ormConditions.push(
      or(
        ilike(articlesTable.title, `%${search}%`),
        ilike(articlesTable.summary, `%${search}%`)
      )!
    );
  }
  const ormWhere = ormConditions.length > 0
    ? ormConditions.reduce((a, b) => sql`${a} AND ${b}`)
    : undefined;

  const [rows, totalResult] = await Promise.all([
    db.execute(sql`
      SELECT a.*,
             lc.content AS ai_comment
      FROM articles a
      LEFT JOIN LATERAL (
        SELECT content
        FROM comments
        WHERE article_id = a.id
        ORDER BY created_at DESC
        LIMIT 1
      ) lc ON true
      ${whereRaw ? sql`WHERE ${whereRaw}` : sql``}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
    db.select({ count: count() }).from(articlesTable).where(ormWhere),
  ]);

  res.json({
    articles: rows.rows.map((r) => {
      const a: typeof articlesTable.$inferSelect = {
        id: r.id as number,
        title: r.title as string,
        sourceUrl: r.source_url as string | null,
        imageUrl: r.image_url as string | null,
        summary: r.summary as string | null,
        content: r.content as string | null,
        category: r.category as string | null,
        shareText: (r.share_text as string | null) ?? null,
        views: (r.views as number) ?? 0,
        createdAt: new Date(r.created_at as string),
        xPostedAt: r.x_posted_at ? new Date(r.x_posted_at as string) : null,
        tgPostedAt: r.tg_posted_at ? new Date(r.tg_posted_at as string) : null,
      };
      return serializeArticle(a, r.ai_comment as string | null);
    }),
    total: Number(totalResult[0]?.count ?? 0),
  });
});

router.get("/articles/trigger-fetch", async (_req, res) => {
  res.status(405).json({ error: "Use POST" });
});

router.post("/articles/trigger-fetch", async (req, res) => {
  req.log.info("Manual fetch triggered");
  try {
    const { runScraper } = await import("../jobs/scraper");
    runScraper().catch(err => req.log.error({ err }, "Background scraper failed"));
    res.json({ success: true, message: "Fetch triggered in background" });
  } catch (err) {
    req.log.error({ err }, "Failed to trigger fetch");
    res.json({ success: false, message: "Failed to trigger fetch" });
  }
});

router.get("/articles/:id", async (req, res) => {
  const parsed = GetArticleParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  let articles = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, parsed.data.id))
    .limit(1);

  if (!articles[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Auto-translate English articles to Chinese on first access
  const art = articles[0];
  if (!hasChinese(art.content) || !hasChinese(art.title)) {
    await translateArticle(art);
    // Re-fetch the updated article
    articles = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.id, parsed.data.id))
      .limit(1);
  }

  // Increment view count + log event (fire-and-forget)
  Promise.all([
    db.update(articlesTable)
      .set({ views: sql`${articlesTable.views} + 1` })
      .where(eq(articlesTable.id, parsed.data.id)),
    db.insert(viewEventsTable).values({ articleId: parsed.data.id }),
  ]).catch(() => {});

  res.json(serializeArticle(articles[0]!));
});

router.get("/articles/:id/adjacent", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [prevRows, nextRows] = await Promise.all([
    db.select({ id: articlesTable.id, title: articlesTable.title })
      .from(articlesTable)
      .where(lt(articlesTable.id, id))
      .orderBy(desc(articlesTable.id))
      .limit(1),
    db.select({ id: articlesTable.id, title: articlesTable.title })
      .from(articlesTable)
      .where(gt(articlesTable.id, id))
      .orderBy(asc(articlesTable.id))
      .limit(1),
  ]);

  res.json({
    prev: prevRows[0] ?? null,
    next: nextRows[0] ?? null,
  });
});

router.get("/comments", async (req, res) => {
  const parsed = ListCommentsQueryParams.safeParse({
    article_id: Number(req.query.article_id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid article_id" });
    return;
  }
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.articleId, parsed.data.article_id))
    .orderBy(desc(commentsTable.createdAt));

  res.json(comments.map(serializeComment));
});

export default router;

// ── Background warmup: translate all remaining English articles on startup ─────

export async function startTranslationWarmup(): Promise<void> {
  // Wait 90s so server is fully up before hammering Gemini
  await new Promise(r => setTimeout(r, 90_000));

  const all = await db.select().from(articlesTable).orderBy(desc(articlesTable.createdAt));
  const english = all.filter(a => !hasChinese(a.content) || !hasChinese(a.title));

  if (english.length === 0) {
    logger.info("Translation warmup: all articles already in Chinese, nothing to do");
    return;
  }

  logger.info({ count: english.length }, "Translation warmup: starting batch translation");

  let done = 0;
  for (const art of english) {
    try {
      await translateArticle(art);
      done++;
      logger.info({ id: art.id, done, total: english.length }, "Warmup translated article");
    } catch (err) {
      logger.warn({ id: art.id, err }, "Warmup translation failed for article");
    }
    // Small delay to avoid Gemini rate limits
    await new Promise(r => setTimeout(r, 1_500));
  }

  logger.info({ done, total: english.length }, "Translation warmup complete");
}
