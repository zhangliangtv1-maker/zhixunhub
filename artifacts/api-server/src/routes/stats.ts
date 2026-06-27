import { Router } from "express";
import { db, articlesTable, commentsTable, subscribersTable, viewEventsTable } from "@workspace/db";
import { count, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/stats/summary", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalArticles, totalComments, articlesToday, topCat, totalSubs, subsToday] = await Promise.all([
    db.select({ count: count() }).from(articlesTable),
    db.select({ count: count() }).from(commentsTable),
    db
      .select({ count: count() })
      .from(articlesTable)
      .where(sql`${articlesTable.createdAt} >= ${today}`),
    db
      .select({ category: articlesTable.category, cnt: count() })
      .from(articlesTable)
      .groupBy(articlesTable.category)
      .orderBy(desc(count()))
      .limit(1),
    db.select({ count: count() }).from(subscribersTable),
    db
      .select({ count: count() })
      .from(subscribersTable)
      .where(sql`${subscribersTable.createdAt} >= ${today}`),
  ]);

  res.json({
    total_articles: Number(totalArticles[0]?.count ?? 0),
    total_comments: Number(totalComments[0]?.count ?? 0),
    articles_today: Number(articlesToday[0]?.count ?? 0),
    top_category: topCat[0]?.category ?? null,
    total_subscribers: Number(totalSubs[0]?.count ?? 0),
    subscribers_today: Number(subsToday[0]?.count ?? 0),
  });
});

router.get("/stats/categories", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const categories = await db
    .select({ category: articlesTable.category, count: count() })
    .from(articlesTable)
    .groupBy(articlesTable.category)
    .orderBy(desc(count()));

  res.json(categories.map((c) => ({ category: c.category, count: Number(c.count) })));
});

router.get("/stats/top-articles", async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const articles = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      category: articlesTable.category,
      views: articlesTable.views,
      created_at: articlesTable.createdAt,
    })
    .from(articlesTable)
    .orderBy(desc(articlesTable.views))
    .limit(10);

  res.json(articles.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    views: a.views,
    created_at: a.created_at,
  })));
});

router.get("/stats/daily-views", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const days = Math.min(Number(req.query["days"] ?? 14), 90);

  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(DATE(viewed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS views
    FROM ${viewEventsTable}
    WHERE viewed_at >= NOW() - (${days} || ' days')::interval
    GROUP BY DATE(viewed_at AT TIME ZONE 'UTC')
    ORDER BY date ASC
  `);

  res.json(rows.rows.map((r) => ({ date: r.date as string, views: r.views as number })));
});

export default router;
