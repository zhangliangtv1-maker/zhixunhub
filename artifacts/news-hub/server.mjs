/**
 * Production server for news-hub.
 * Serves prerendered article HTML for SEO, falls back to SPA index.html.
 */
import express from "express";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist/public");
const PORT = process.env.PORT || 24595;

const app = express();

// For /article/:id — serve prerendered HTML BEFORE static middleware
// so express.static doesn't redirect /article/800 → /article/800/
app.use("/article", (req, res, next) => {
  const match = req.path.match(/^\/(\d+)\/?$/);
  if (match) {
    const prerendered = join(distDir, "article", match[1], "index.html");
    if (existsSync(prerendered)) {
      return res.sendFile(prerendered);
    }
  }
  next();
});

// Serve all static assets (JS, CSS, images, fonts, robots.txt, etc.)
app.use(express.static(distDir, { index: false }));

// All other routes: SPA fallback
app.use((_req, res) => {
  res.sendFile(join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`News Hub server listening on port ${PORT}`);
});
