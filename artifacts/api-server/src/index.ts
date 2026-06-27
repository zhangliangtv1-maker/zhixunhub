import app from "./app";
import { logger } from "./lib/logger";
import { startScraperScheduler } from "./jobs/scraper";
import { startTranslationWarmup } from "./routes/articles";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — server continues");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection — server continues");
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  startScraperScheduler();
  startTranslationWarmup().catch(err => logger.error({ err }, "Translation warmup failed"));
});
