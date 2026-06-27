import { Router } from "express";
import { db, articlesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

const DOMAIN = "https://zhixunhub.com";

const STATIC_PAGES = [
  { loc: "/",           changefreq: "hourly",  priority: "1.0" },
  { loc: "/categories", changefreq: "daily",   priority: "0.8" },
  { loc: "/about",      changefreq: "monthly", priority: "0.5" },
];

async function buildSitemapXml(): Promise<string> {
  const articles = await db
    .select({ id: articlesTable.id, updatedAt: articlesTable.createdAt })
    .from(articlesTable)
    .orderBy(desc(articlesTable.createdAt));

  const now = new Date().toISOString().split("T")[0];

  const staticEntries = STATIC_PAGES.map(p => `
  <url>
    <loc>${DOMAIN}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("");

  const articleEntries = articles.map(a => {
    const lastmod = a.updatedAt
      ? new Date(a.updatedAt).toISOString().split("T")[0]
      : now;
    return `
  <url>
    <loc>${DOMAIN}/article/${a.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticEntries}${articleEntries}
</urlset>`;
}

async function serveSitemap(req: any, res: any) {
  try {
    const xml = await buildSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    req.log.error({ err }, "Sitemap generation failed");
    res.status(500).send("Sitemap generation failed");
  }
}

router.get("/sitemap.xml", serveSitemap);
router.get("/api/sitemap.xml", serveSitemap);

router.get("/sitemap.xml/sitemap.xml", (_req, res) => {
  res.redirect(301, "/api/sitemap.xml");
});

export default router;
