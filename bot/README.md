# NewsHub Bot

Automated news scraping and processing bot for NewsHub.

## What it does

1. **Scrapes** article links from TechCrunch using Firecrawl API
2. **Processes** each article with Gemini Flash AI to:
   - Remove ads and clutter
   - Generate a 150-200 word professional summary
   - Classify by category
3. **Stores** cleaned articles in Supabase
4. **Posts** an AI analyst comment for each article (via Gemini)

## Setup

```bash
cd bot
pip install -r requirements.txt
```

## Run manually

```bash
python3 bot.py
```

## Cron Job (every 6 hours)

```bash
chmod +x cron.sh

# Add to crontab:
crontab -e
# Add this line:
0 */6 * * * /absolute/path/to/bot/cron.sh >> /absolute/path/to/bot/cron.log 2>&1
```

## Environment Variables Required

- `FIRECRAWL_API_KEY` — from firecrawl.dev
- `GEMINI_API_KEY` — from Google AI Studio
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for write access)

## Target Site

Default: TechCrunch (`https://techcrunch.com`)

To change the target, edit `TARGET_URL` in `bot.py`.
