/**
 * NewsHub Scraper v3 — RSS-based multi-source scraping
 * RSS feeds guarantee only recent articles with reliable publish dates.
 * Firecrawl is used only to fetch full article content (not for discovery).
 */
import { db, articlesTable, commentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const ARTICLES_PER_SITE = 5;
const MAX_AGE_HOURS = 48;

const SOURCES = [
  { name: "TechCrunch",   rss: "https://techcrunch.com/feed/" },
  { name: "The Verge",    rss: "https://www.theverge.com/rss/index.xml" },
  { name: "Wired",        rss: "https://www.wired.com/feed/rss" },
  { name: "Ars Technica", rss: "https://feeds.arstechnica.com/arstechnica/index" },
  { name: "VentureBeat",  rss: "https://venturebeat.com/feed/" },
  { name: "MIT Tech Review", rss: "https://www.technologyreview.com/feed/" },
];

const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
];

// ── RSS Parser ────────────────────────────────────────────────────────────────

interface RssItem { url: string; pubDate: Date; title: string }

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const cutoff = Date.now() - MAX_AGE_HOURS * 3_600_000;

  // Support both RSS 2.0 <item> and Atom <entry>
  const itemRe = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];

    // URL: <link>url</link> or <link href="url"/>
    const urlMatch =
      block.match(/<link>([^<]+)<\/link>/) ??
      block.match(/<link[^>]+href="([^"]+)"/) ??
      block.match(/<guid[^>]*>([^<]+)<\/guid>/);

    // Date: pubDate, published, updated, dc:date
    const dateMatch =
      block.match(/<pubDate>([^<]+)<\/pubDate>/) ??
      block.match(/<published>([^<]+)<\/published>/) ??
      block.match(/<updated>([^<]+)<\/updated>/) ??
      block.match(/<dc:date>([^<]+)<\/dc:date>/);

    // Title
    const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);

    if (!urlMatch || !dateMatch) continue;

    const url = urlMatch[1].trim().replace(/&amp;/g, "&");
    const pubDate = new Date(dateMatch[1].trim());
    const title = (titleMatch?.[1] ?? "").trim();

    if (!url.startsWith("http")) continue;
    if (isNaN(pubDate.getTime())) continue;
    if (pubDate.getTime() < cutoff) continue; // older than 48h

    items.push({ url, pubDate, title });
  }

  return items;
}

async function fetchRss(feedUrl: string): Promise<RssItem[]> {
  try {
    const resp = await fetch(feedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsHubBot/3.0)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) { logger.warn({ status: resp.status, feedUrl }, "RSS fetch failed"); return []; }
    const xml = await resp.text();
    const items = parseRss(xml);
    logger.info({ feedUrl, count: items.length }, "RSS fetched");
    return items;
  } catch (err) {
    logger.warn({ err, feedUrl }, "RSS fetch error");
    return [];
  }
}

// ── Firecrawl (content only) ──────────────────────────────────────────────────

async function firecrawlScrape(url: string): Promise<Record<string, unknown> | null> {
  const key = process.env["FIRECRAWL_API_KEY"];
  if (!key) return null;

  const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!resp.ok) return null;

  const data = await resp.json() as { success?: boolean; data?: Record<string, unknown> };
  return data.success ? (data.data ?? null) : null;
}

function extractImageUrl(scraped: Record<string, unknown>): string | null {
  const meta = (scraped["metadata"] ?? {}) as Record<string, unknown>;
  for (const key of ["leadImage", "lead_image", "ogImage", "og:image", "twitter:image", "twitterImage", "image"]) {
    const val = meta[key];
    if (typeof val === "string" && val.startsWith("http")) {
      return val.split("?")[0];
    }
  }
  return null;
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function geminiPost(prompt: string, temperature = 0.4, maxTokens = 4096): Promise<string | null> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) { logger.warn("GEMINI_API_KEY not set"); return null; }

  for (const model of GEMINI_MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens: maxTokens },
          }),
          signal: AbortSignal.timeout(45_000),
        }
      );
      if (!resp.ok) { logger.warn({ status: resp.status, model }, "Gemini model failed"); continue; }
      const data = await resp.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (err) {
      logger.warn({ err, model }, "Gemini error");
    }
  }
  logger.error("All Gemini models failed");
  return null;
}

function parseJson(text: string): Record<string, string> | null {
  try {
    let s = text.trim();
    if (s.startsWith("```")) { s = s.split("```")[1] ?? s; if (s.startsWith("json")) s = s.slice(4); }
    s = s.trim().replace(/```\s*$/, "").trim();
    return JSON.parse(s);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* ignore */ } }
    return null;
  }
}

async function geminiProcessArticle(title: string, content: string, sourceName: string): Promise<Record<string, string> | null> {
  const prompt = `你是智讯 Hub 的首席科技编辑。请将以下来自 ${sourceName} 的英文科技文章转化为中文内参，返回纯 JSON 对象。

原文标题：${title}
原文正文：
${content.slice(0, 6000)}

返回格式（纯 JSON，禁止输出 markdown 代码块或任何解释文字）：
{"title":"完整的中文标题，整句必须是中文，可保留品牌名/产品名等专有名词，但动词/名词/描述词必须翻译为中文，不得保留英文句子结构","summary":"200字左右的中文摘要，专业精炼，涵盖核心事件、关键数据和市场意义","content":"400-600字的中文深度拆解：包括【背景与来龙去脉】【核心事件与关键细节】【行业影响与深层逻辑】三个维度，用流畅中文写成连续段落，不要用标题分节，保留公司名/人名/技术术语等英文专有名词","category":"以下之一：AI / Technology / Business / Security / Health / Policy / Space"}

强制规则：
1. title 必须是地道中文句子，不能是英文句子的直接保留；标题中可含 OpenAI、Apple、Tesla 等品牌名，但整体结构必须是中文
2. summary 和 content 全部用中文输出
3. content 必须是原创深度分析，不是逐句翻译
4. category 必须完全匹配上述英文选项之一
5. 输出纯 JSON，不加任何 markdown 格式`;

  const text = await geminiPost(prompt, 0.3, 4096);
  if (!text) return null;
  const parsed = parseJson(text);
  if (!parsed) logger.error({ text: text.slice(0, 200) }, "Gemini returned invalid JSON");
  return parsed;
}

async function geminiGenerateCommentary(title: string, summary: string): Promise<string | null> {
  const prompt = `你是智讯 Hub 首席分析师，以犀利著称，擅长在科技新闻背后挖掘别人看不见的产业逻辑。

请针对以下新闻，写一段100到150字的中文锐评。必须严格按照以下三层结构展开（但不要写标题或分节符号，直接写成一整段流畅的中文）：
1. 现象分析：这件事的本质是什么，不要复述新闻，要给出你的判断
2. 行业影响：对竞争格局、上下游、或资本市场意味着什么
3. 独家洞察：给出一个旁人未必想到的预判或警示

语气要求：直接、锐利、有立场，敢于给出明确观点，杜绝"值得关注""仍需观察"之类的废话套话。可保留公司名、人名等英文专有名词。开头直接进入正文，不要任何前缀。字数严格控制在100到150字之间，句子必须写完整，不得截断。

标题：${title}
摘要：${summary}`;

  return geminiPost(prompt, 0.75, 800);
}

// ── DB helpers ───────────────────────────────────────────────────────────────

async function articleExists(url: string): Promise<boolean> {
  const rows = await db.select({ id: articlesTable.id })
    .from(articlesTable).where(eq(articlesTable.sourceUrl, url)).limit(1);
  return rows.length > 0;
}

async function saveArticle(data: Record<string, string>, sourceUrl: string, imageUrl: string | null): Promise<number | null> {
  try {
    const rows = await db.insert(articlesTable).values({
      title: data["title"] ?? "Untitled",
      sourceUrl,
      summary:  data["summary"] ?? null,
      content:  data["content"] ?? null,
      category: data["category"] ?? "Technology",
      imageUrl,
    }).onConflictDoNothing().returning({ id: articlesTable.id });
    const id = rows[0]?.id ?? null;
    if (id) logger.info({ id, title: (data["title"] ?? "").slice(0, 60) }, "Article saved");
    return id ?? null;
  } catch (err) {
    logger.error({ err, sourceUrl }, "Failed to save article");
    return null;
  }
}

async function saveCommentary(articleId: number, text: string): Promise<void> {
  try {
    await db.insert(commentsTable).values({ articleId, commenterName: "智讯 Hub 首席分析师", content: text });
    logger.info({ articleId }, "Commentary saved");
  } catch (err) {
    logger.error({ err, articleId }, "Failed to save commentary");
  }
}

// ── Per-site processor ───────────────────────────────────────────────────────

async function processSite(source: { name: string; rss: string }): Promise<{ processed: number; skipped: number; failed: number }> {
  const stats = { processed: 0, skipped: 0, failed: 0 };
  logger.info({ site: source.name }, "Starting site");

  const rssItems = await fetchRss(source.rss);
  if (!rssItems.length) { logger.warn({ site: source.name }, "No recent RSS items"); return stats; }

  // Exclude digest/roundup/deals/coupon articles
  const EXCLUDE_PATTERNS = [
    "/the-download/", "the-download-", "/download-", "/newsletter/",
    "/weekly-", "/roundup/", "/digest/", "/this-week/", "/recap/",
    "-deals-", "-deal-", "-coupon", "-promo-", "-discount", "-savings-",
    "/deals/", "/coupons/", "/best-", "/book-excerpt", "/gift-guide",
    // Block URLs containing old years (re-circulated archive articles)
    "/2023/", "/2022/", "/2021/", "/2020/", "/2019/",
  ];

  const newItems: RssItem[] = [];
  for (const item of rssItems) {
    if (newItems.length >= ARTICLES_PER_SITE) break;
    if (EXCLUDE_PATTERNS.some(p => item.url.toLowerCase().includes(p))) {
      logger.info({ url: item.url }, "Skipped: digest/roundup article");
      stats.skipped++;
      continue;
    }
    if (await articleExists(item.url)) { stats.skipped++; continue; }
    newItems.push(item);
  }

  logger.info({ site: source.name, newItems: newItems.length, skipped: stats.skipped }, "Links ready");

  for (const item of newItems) {
    try {
      const scraped = await firecrawlScrape(item.url);
      if (!scraped) { stats.failed++; continue; }

      const rawContent = ((scraped["markdown"] ?? scraped["content"] ?? "") as string);
      if (rawContent.length < 200) { stats.failed++; continue; }

      const rawTitle = item.title || ((scraped["metadata"] as Record<string, unknown>)?.["title"] ?? "Untitled") as string;
      const imageUrl = extractImageUrl(scraped);
      const articleData = await geminiProcessArticle(rawTitle, rawContent, source.name);
      if (!articleData) { stats.failed++; continue; }

      const articleId = await saveArticle(articleData, item.url, imageUrl);
      if (!articleId) { stats.skipped++; continue; }

      const commentary = await geminiGenerateCommentary(articleData["title"] ?? rawTitle, articleData["summary"] ?? "");
      if (commentary) await saveCommentary(articleId, commentary);

      stats.processed++;
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      logger.error({ err, url: item.url }, "Error processing article");
      stats.failed++;
    }
  }

  logger.info({ site: source.name, ...stats }, "Site done");
  return stats;
}

// ── Main export ───────────────────────────────────────────────────────────────

let _running = false;

export async function runScraper(): Promise<{ processed: number; skipped: number }> {
  if (_running) { logger.info("Scraper already running, skipping"); return { processed: 0, skipped: 0 }; }
  _running = true;
  logger.info({ sources: SOURCES.map(s => s.name) }, "=== Scraper v3 (RSS) starting ===");

  let processed = 0, skipped = 0;

  try {
    const results = await Promise.allSettled(SOURCES.map(s => processSite(s)));
    for (const r of results) {
      if (r.status === "fulfilled") { processed += r.value.processed; skipped += r.value.skipped; }
      else logger.error({ reason: r.reason }, "Site worker failed");
    }
  } finally {
    _running = false;
    logger.info({ processed, skipped }, "=== Scraper done ===");
  }

  return { processed, skipped };
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

const SIX_HOURS = 6 * 60 * 60 * 1000;

export function startScraperScheduler(): void {
  const hasKeys = process.env["FIRECRAWL_API_KEY"] && process.env["GEMINI_API_KEY"];
  if (!hasKeys) { logger.warn("Scraper disabled — FIRECRAWL_API_KEY or GEMINI_API_KEY not set"); return; }
  logger.info("Scraper scheduler started — first run in 30s, then every 6h");
  setTimeout(() => {
    runScraper().catch(err => logger.error({ err }, "Scraper run failed"));
    setInterval(() => {
      runScraper().catch(err => logger.error({ err }, "Scraper run failed"));
    }, SIX_HOURS);
  }, 30_000);
}
