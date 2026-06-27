import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

const UNSPLASH: Record<string, string> = {
  AI:         "photo-1677442135703-1787eea5ce01",
  Technology: "photo-1518770660439-4636190af475",
  Business:   "photo-1507679799987-c73779587ccf",
  Security:   "photo-1550751827-4bd374c3f58b",
  Health:     "photo-1559757148-5c350d0d3c56",
  Policy:     "photo-1529107386315-e1a2ed48a620",
  Space:      "photo-1446776877081-d282a0f896e2",
};
const DEFAULT_PHOTO = "photo-1504711434969-e33886168f5c";

function getOgImage(article: { imageUrl: string | null; category: string | null }): string {
  if (article.imageUrl) return article.imageUrl;
  const photoId = article.category ? (UNSPLASH[article.category] ?? DEFAULT_PHOTO) : DEFAULT_PHOTO;
  return `https://images.unsplash.com/${photoId}?w=1200&h=630&fit=crop&auto=format`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOgHtml(article: {
  id: number;
  title: string;
  summary: string | null;
  category: string | null;
  imageUrl: string | null;
}): string {
  // og:url points to this same /api/og/:id endpoint so Facebook never has
  // to verify /article/:id (which is behind CDN bot protection → 403).
  // The meta refresh sends real users straight to the article.
  const ogSelf = `https://zhixunhub.com/api/og/${article.id}`;
  const articleUrl = `https://zhixunhub.com/article/${article.id}`;
  const title = `${article.title} | 智讯 Hub`;
  const desc = article.summary
    ? article.summary.slice(0, 200)
    : "智讯 Hub — 全自动聚合硅谷科技资讯，AI 驱动中文内参站。";
  const image = getOgImage(article);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(ogSelf)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="智讯 Hub" />
  <meta property="og:locale" content="zh_CN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="canonical" href="${escapeHtml(articleUrl)}" />
</head>
<body>
  <p>正在跳转… <a href="${escapeHtml(articleUrl)}">点击这里</a></p>
  <script>window.location.replace("${escapeHtml(articleUrl)}");</script>
</body>
</html>`;
}

async function fetchArticleOg(id: number) {
  const rows = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      summary: articlesTable.summary,
      category: articlesTable.category,
      imageUrl: articlesTable.imageUrl,
    })
    .from(articlesTable)
    .where(eq(articlesTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// /api/og/:id
// Always serves OG HTML with article-specific meta tags.
// Real users are redirected via <meta http-equiv="refresh"> to /article/:id.
// Crawlers (Facebook, X, Slack…) read the OG tags directly.
router.get("/og/:id", async (req: Request, res: Response) => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(404).send("Not found");
    return;
  }
  try {
    const article = await fetchArticleOg(id);
    if (!article) {
      res.redirect(302, "https://zhixunhub.com");
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buildOgHtml(article));
  } catch (err) {
    logger.error({ err }, "OG route error");
    res.status(500).send("Server error");
  }
});

export default router;
