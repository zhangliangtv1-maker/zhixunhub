/**
 * prerender.mjs
 * Runs after `vite build`. For each article in the production API,
 * generates a static HTML file at dist/public/article/{id}/index.html
 * with fully pre-filled <title>, meta description, OG tags, and JSON-LD.
 * Googlebot reads this directly — no JavaScript required.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "../dist/public");
const templatePath = join(distDir, "index.html");

if (!existsSync(templatePath)) {
  console.warn("prerender: dist/public/index.html not found — skipping");
  process.exit(0);
}

const template = readFileSync(templatePath, "utf-8");

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unsplashUrl(photoId) {
  const id =
    photoId && photoId.startsWith("photo-")
      ? photoId
      : "photo-1504711434969-e33886168f5c";
  return `https://images.unsplash.com/${id}?w=1200&h=630&fit=crop&auto=format`;
}

/**
 * Replace <meta> tag content regardless of attribute order.
 * Handles both:
 *   <meta property="og:title" content="...">
 *   <meta content="..." property="og:title">
 */
function setMetaContent(html, attrName, attrValue, newContent) {
  const escaped = esc(newContent);
  // Order 1: attrName=attrValue ... content="..."
  html = html.replace(
    new RegExp(
      `(<meta[^>]+${escRe(attrName)}="${escRe(attrValue)}"[^>]+content=")[^"]*(")`
    ),
    `$1${escaped}$2`
  );
  // Order 2: content="..." ... attrName=attrValue
  html = html.replace(
    new RegExp(
      `(<meta[^>]+content=")[^"]*("[^>]+${escRe(attrName)}="${escRe(attrValue)}")`
    ),
    `$1${escaped}$2`
  );
  return html;
}

/**
 * Replace a specific <meta> attribute value (e.g., name="robots" content="...").
 */
function setMetaAttrContent(html, nameAttr, nameVal, newContent) {
  const escaped = esc(newContent);
  html = html.replace(
    new RegExp(
      `(<meta[^>]+${escRe(nameAttr)}="${escRe(nameVal)}"[^>]+content=")[^"]*(")`
    ),
    `$1${escaped}$2`
  );
  html = html.replace(
    new RegExp(
      `(<meta[^>]+content=")[^"]*("[^>]+${escRe(nameAttr)}="${escRe(nameVal)}")`
    ),
    `$1${escaped}$2`
  );
  return html;
}

// ── Fetch articles ────────────────────────────────────────────────────────────

let articles = [];
const ENDPOINTS = [
  "https://zhixunhub.com/api/articles?limit=500",
];

for (const url of ENDPOINTS) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      const data = await res.json();
      articles = data.articles ?? [];
      console.log(`prerender: fetched ${articles.length} articles from ${url}`);
      break;
    } else {
      console.warn(`prerender: ${url} returned ${res.status}`);
    }
  } catch (e) {
    console.warn(`prerender: ${url} failed — ${e.message}`);
  }
}

if (articles.length === 0) {
  console.warn("prerender: no articles fetched — skipping HTML generation");
  process.exit(0);
}

// ── Generate HTML per article ─────────────────────────────────────────────────

let count = 0;

for (const article of articles) {
  const id = article.id;
  const rawTitle = article.title || "";
  const title = `${rawTitle} | 智讯 Hub`;
  const description = (article.summary || rawTitle).slice(0, 160);
  const pageUrl = `https://zhixunhub.com/article/${id}`;
  const image = unsplashUrl(article.image_url);
  const publishedAt =
    article.published_at || article.created_at || new Date().toISOString();

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: rawTitle,
    description,
    url: pageUrl,
    image,
    datePublished: publishedAt,
    inLanguage: "zh-CN",
    publisher: {
      "@type": "Organization",
      name: "智讯 Hub",
      url: "https://zhixunhub.com",
    },
  });

  let html = template;

  // ── <title> ──────────────────────────────────────────────────────────────
  // Remove ALL existing <title> tags, then inject one clean article title
  html = html.replace(/<title>[^<]*<\/title>/g, "");
  html = html.replace(
    "<head>",
    `<head>\n  <title>${esc(title)}</title>`
  );

  // ── meta description ─────────────────────────────────────────────────────
  html = setMetaAttrContent(html, "name", "description", description);

  // ── OG tags ──────────────────────────────────────────────────────────────
  html = setMetaContent(html, "property", "og:title", title);
  html = setMetaContent(html, "property", "og:description", description);
  html = setMetaContent(html, "property", "og:url", pageUrl);
  html = setMetaContent(html, "property", "og:type", "article");

  // og:image — replace or inject
  if (html.includes('property="og:image"') || html.includes("og:image")) {
    html = setMetaContent(html, "property", "og:image", image);
  } else {
    html = html.replace(
      "</head>",
      `  <meta property="og:image" content="${esc(image)}" />\n</head>`
    );
  }

  // ── Twitter Card tags ─────────────────────────────────────────────────────
  html = setMetaAttrContent(html, "name", "twitter:title", title);
  html = setMetaAttrContent(html, "name", "twitter:description", description);

  // ── canonical ─────────────────────────────────────────────────────────────
  if (html.includes('rel="canonical"')) {
    html = html.replace(
      /<link\s+rel="canonical"[^>]*>/,
      `<link rel="canonical" href="${esc(pageUrl)}" />`
    );
  } else {
    html = html.replace(
      "</head>",
      `  <link rel="canonical" href="${esc(pageUrl)}" />\n</head>`
    );
  }

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  html = html.replace(
    "</head>",
    `  <script type="application/ld+json">${jsonLd}</script>\n</head>`
  );

  const dir = join(distDir, "article", String(id));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html, "utf-8");
  count++;
}

console.log(`prerender: ✓ generated ${count} article pages in dist/public/article/`);
