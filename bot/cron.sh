#!/bin/bash
# NewsHub Cron Job — runs bot every 6 hours
# To install: crontab -e
# Then add: 0 */6 * * * /path/to/bot/cron.sh >> /path/to/bot/cron.log 2>&1

cd "$(dirname "$0")"

export FIRECRAWL_API_KEY="${FIRECRAWL_API_KEY}"
export GEMINI_API_KEY="${GEMINI_API_KEY}"
export SUPABASE_URL="${SUPABASE_URL}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "[$(date)] Starting NewsHub bot run"
python3 bot.py
echo "[$(date)] Bot run complete"
