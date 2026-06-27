#!/bin/bash
# Production startup: API server + bot scheduler running together

PYTHON="/home/runner/workspace/.pythonlibs/bin/python3"
if [ ! -f "$PYTHON" ]; then
  PYTHON="python3"
fi

echo "[start-production] Starting bot scheduler in background..."
"$PYTHON" bot/scheduler.py &
BOT_PID=$!
echo "[start-production] Bot scheduler PID: $BOT_PID"

echo "[start-production] Starting API server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
