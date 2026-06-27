import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import sitemapRouter from "./routes/sitemap";
import ogRouter from "./routes/og";
import { logger } from "./lib/logger";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const host = req.hostname;
  if (host === "inflationcalc.app" && (req.path === "/" || req.path === "")) {
    return res.redirect(301, "/inflation-calc/");
  }
  next();
});

app.use(sitemapRouter);
app.use("/api", ogRouter);
app.use("/api", router);

// Serve frontend (news-hub) static files
const frontendDist = join(__dirname, "..", "..", "news-hub", "dist", "public");
if (existsSync(frontendDist)) {
  // Serve prerendered article pages
  app.use("/article", (req: Request, res: Response, next: NextFunction) => {
    const match = req.path.match(/^\/(\d+)\/?$/);
    if (match) {
      const prerendered = join(frontendDist, "article", match[1], "index.html");
      if (existsSync(prerendered)) {
        return res.sendFile(prerendered);
      }
    }
    next();
  });
  app.use(express.static(frontendDist, { index: false }));
  // SPA fallback — serve index.html for any non-API, non-static route
  app.use((req: Request, res: Response) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(join(frontendDist, "index.html"));
    }
  });
  logger.info({ path: frontendDist }, "Serving frontend static files");
} else {
  logger.warn({ path: frontendDist }, "Frontend dist not found — serving API only");
}

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.url }, "Unhandled route error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
