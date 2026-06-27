# NewsHub — 全自动新闻聚合平台

A fully automated news aggregation platform that scrapes TechCrunch via Firecrawl, processes articles with Gemini AI, and displays them in a Google News-style interface.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/news-hub run dev` — run the frontend (port 24595)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Bot

- `cd bot && python3 bot.py` — run the scraper bot manually
- Bot reads from: `FIRECRAWL_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Cron setup: `0 */6 * * * /path/to/bot/cron.sh` — runs every 6 hours
- Python deps auto-installed via `.pythonlibs/` (uv-managed)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Wouter
- API: Express 5
- DB: PostgreSQL (Replit built-in) + Drizzle ORM
- Bot: Python 3 + httpx + supabase-py
- AI: Gemini Flash API (article processing + analyst comments)
- Scraping: Firecrawl API
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/articles.ts` — articles + comments DB schema
- `artifacts/api-server/src/routes/articles.ts` — articles/comments API
- `artifacts/api-server/src/routes/stats.ts` — stats/categories API
- `artifacts/api-server/src/lib/serialize.ts` — camelCase→snake_case serializer
- `artifacts/news-hub/src/` — React frontend
- `bot/bot.py` — scraper bot (Firecrawl + Gemini + Supabase)
- `bot/social_poster.py` — X + Facebook 自動發文
- `bot/telegram_poster.py` — Telegram 群組自動推送早報
- `bot/cron.sh` — cron wrapper script
- `bot/requirements.txt` — Python deps

## Architecture decisions

- Replit built-in PostgreSQL for the local/dev DB; Supabase used by bot.py for production writes (bot writes directly to Supabase, frontend reads via local API backed by Replit DB in dev)
- Drizzle returns camelCase; custom serializers in `serialize.ts` map to snake_case matching the OpenAPI spec
- Bot runs detached (spawned as background process) when "Refresh Now" is triggered from the UI
- OpenAPI-first: all types and hooks generated from spec, never hand-written

## Product

- Home page: Google News-style 4-column card grid with category filters, search, and stats bar
- Article detail: full content view with AI analyst comment section
- Categories page: browse by category with article counts
- Refresh Now: triggers bot.py to fetch new articles immediately
- Dark mode: full theme support via next-themes

## User preferences

- Target site: TechCrunch (configurable via `TARGET_URL` in `bot/bot.py`)
- Language: Chinese/English bilingual summaries supported

## Gotchas

- Bot uses `.pythonlibs/` virtual env managed by `uv` — run scripts via `python3 bot.py` in project root
- `pnpm run dev` at workspace root is not supported — use workflow or per-package commands
- After spec changes, always run codegen before using updated types
- The `trigger-fetch` POST endpoint spawns `bot.py` as a background process — check logs for output

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
