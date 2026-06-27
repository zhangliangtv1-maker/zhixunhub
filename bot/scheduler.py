#!/usr/bin/env python3
"""
NewsHub Scheduler — runs bot.py every 6h, newsletter daily, social poster 4x/day.
Includes catch-up logic: if a scheduled social slot was missed (restart/sleep),
it runs immediately on startup.
"""

import time
import subprocess
import logging
import os
import json
from datetime import datetime, timezone, timedelta

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("newshub-scheduler")

INTERVAL_HOURS = 6
INTERVAL_SECONDS = INTERVAL_HOURS * 60 * 60

BOT_DIR = os.path.dirname(os.path.abspath(__file__))
BOT_SCRIPT = os.path.join(BOT_DIR, "bot.py")
NEWSLETTER_SCRIPT = os.path.join(BOT_DIR, "newsletter.py")
SOCIAL_SCRIPT = os.path.join(BOT_DIR, "social_poster.py")
TELEGRAM_SCRIPT = os.path.join(BOT_DIR, "telegram_poster.py")
STATE_FILE = os.path.join(BOT_DIR, ".scheduler_state.json")

# 8 AM Pacific Daylight Time (PDT) = 15:00 UTC
NEWSLETTER_HOUR_UTC = 15
# 每天 4 次：北京时间 9:00 / 15:00 / 21:00 / 03:00 = UTC 1:00 / 7:00 / 13:00 / 19:00
SOCIAL_HOURS_UTC = {1, 7, 13, 19}
# Telegram 早报：北京时间 8:00 = UTC 0:00
TELEGRAM_HOUR_UTC = 0


def load_state() -> dict:
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE) as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def save_state(state: dict):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f)
    except Exception as e:
        log.warning(f"Failed to save state: {e}")


def last_social_slot_before(now: datetime) -> tuple | None:
    """Return (date_str, hour) of the most recent social slot before now."""
    for h in range(23, -1, -1):
        candidate = now.replace(hour=h, minute=0, second=0, microsecond=0)
        if candidate <= now and h in SOCIAL_HOURS_UTC:
            return (candidate.date().isoformat(), h)
    # Check previous day
    yesterday = (now - timedelta(days=1)).replace(minute=0, second=0, microsecond=0)
    for h in sorted(SOCIAL_HOURS_UTC, reverse=True):
        candidate = yesterday.replace(hour=h)
        if candidate <= now:
            return (candidate.date().isoformat(), h)
    return None


def run_bot():
    log.info(f"=== Triggering bot run at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    try:
        result = subprocess.run(
            ["python3", BOT_SCRIPT],
            cwd=BOT_DIR,
            timeout=600,
            capture_output=False,
        )
        if result.returncode == 0:
            log.info("Bot run completed successfully")
        else:
            log.warning(f"Bot run exited with code {result.returncode}")
    except subprocess.TimeoutExpired:
        log.error("Bot run timed out after 10 minutes")
    except Exception as e:
        log.error(f"Failed to run bot: {e}")


def run_newsletter():
    log.info(f"=== Triggering newsletter at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    try:
        result = subprocess.run(
            ["python3", NEWSLETTER_SCRIPT],
            cwd=BOT_DIR,
            timeout=300,
            capture_output=False,
        )
        if result.returncode == 0:
            log.info("Newsletter sent successfully")
        else:
            log.warning(f"Newsletter exited with code {result.returncode}")
    except subprocess.TimeoutExpired:
        log.error("Newsletter timed out after 5 minutes")
    except Exception as e:
        log.error(f"Failed to run newsletter: {e}")


def run_social_poster(reason: str = "scheduled"):
    log.info(f"=== Triggering social poster [{reason}] at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    try:
        result = subprocess.run(
            ["python3", SOCIAL_SCRIPT],
            cwd=BOT_DIR,
            timeout=120,
            capture_output=False,
        )
        if result.returncode == 0:
            log.info("Social poster completed successfully")
        else:
            log.warning(f"Social poster exited with code {result.returncode}")
    except subprocess.TimeoutExpired:
        log.error("Social poster timed out after 2 minutes")
    except Exception as e:
        log.error(f"Failed to run social poster: {e}")


def run_telegram_poster():
    log.info(f"=== Triggering Telegram poster at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    try:
        result = subprocess.run(
            ["python3", TELEGRAM_SCRIPT],
            cwd=BOT_DIR,
            timeout=60,
            capture_output=False,
        )
        if result.returncode == 0:
            log.info("Telegram poster completed successfully")
        else:
            log.warning(f"Telegram poster exited with code {result.returncode}")
    except subprocess.TimeoutExpired:
        log.error("Telegram poster timed out after 1 minute")
    except Exception as e:
        log.error(f"Failed to run Telegram poster: {e}")


def main():
    log.info(
        f"NewsHub Scheduler started — "
        f"bot every {INTERVAL_HOURS}h, "
        f"newsletter daily at 8:00 AM PT (15:00 UTC), "
        f"social poster 4x daily at UTC 1/7/13/19 (CST 9/15/21/3)"
    )

    state = load_state()
    now_utc = datetime.now(timezone.utc)

    # --- Catch-up: check if most recent social slot was missed ---
    last_slot = last_social_slot_before(now_utc)
    last_ran = state.get("last_social_slot")  # stored as "date_str:hour"
    if last_slot:
        slot_key = f"{last_slot[0]}:{last_slot[1]}"
        if last_ran != slot_key:
            log.info(f"Catch-up: missed social slot UTC {last_slot[1]:02d}:00 on {last_slot[0]}, running now")
            run_social_poster(reason="catch-up")
            state["last_social_slot"] = slot_key
            save_state(state)
        else:
            log.info(f"Catch-up: last social slot {slot_key} already ran, no catch-up needed")

    # Run bot immediately on startup
    run_bot()

    last_newsletter_date = None
    last_bot_run = time.time()

    while True:
        time.sleep(60)  # Check every minute

        now_utc = datetime.now(timezone.utc)
        today = now_utc.date()
        state = load_state()

        # --- Daily newsletter at configured UTC hour ---
        if now_utc.hour == NEWSLETTER_HOUR_UTC and last_newsletter_date != today:
            last_newsletter_date = today
            run_newsletter()

        # --- Social post 4x daily at UTC 1/7/13/19 ---
        if now_utc.hour in SOCIAL_HOURS_UTC and now_utc.minute < 2:
            slot_key = f"{today.isoformat()}:{now_utc.hour}"
            if state.get("last_social_slot") != slot_key:
                state["last_social_slot"] = slot_key
                save_state(state)
                run_social_poster(reason="scheduled")

        # --- Telegram 早报：北京时间每天 8:00 (UTC 0:00) ---
        if now_utc.hour == TELEGRAM_HOUR_UTC and now_utc.minute < 2:
            tg_slot_key = today.isoformat()
            if state.get("last_tg_slot") != tg_slot_key:
                state["last_tg_slot"] = tg_slot_key
                save_state(state)
                run_telegram_poster()

        # --- Bot every 6 hours ---
        elapsed = time.time() - last_bot_run
        if elapsed >= INTERVAL_SECONDS:
            last_bot_run = time.time()
            run_bot()


if __name__ == "__main__":
    main()
