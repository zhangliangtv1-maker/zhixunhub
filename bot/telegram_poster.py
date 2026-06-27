#!/usr/bin/env python3
"""
智讯 Hub Telegram Poster
每天自动挑选热门文章，发送到 Telegram 频道。
"""

import os
import logging
import httpx
import psycopg2

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("telegram-poster")

DATABASE_URL    = os.environ["DATABASE_URL"]
BOT_TOKEN       = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHANNEL_ID      = os.environ.get("TELEGRAM_CHANNEL_ID", "")  # e.g. @zhixunhub
SITE_URL        = "https://zhixunhub.com"
TG_API         = f"https://api.telegram.org/bot{BOT_TOKEN}"

# 每次发送的文章数量
ARTICLES_PER_POST = 5


def get_top_articles(limit: int = ARTICLES_PER_POST) -> list[dict]:
    """从生产 API 获取热门文章，跳过已发过 Telegram 的。"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(
            "SELECT source_url FROM articles WHERE tg_posted_at IS NOT NULL AND source_url IS NOT NULL"
        )
        posted_urls = {r[0] for r in cur.fetchall()}
        cur.close()
        conn.close()
    except Exception as e:
        log.warning(f"读取已发 Telegram 记录失败（将允许所有文章）: {e}")
        posted_urls = set()

    try:
        resp = httpx.get(
            f"{SITE_URL}/api/articles",
            params={"limit": 50},
            timeout=15,
            follow_redirects=True,
        )
        resp.raise_for_status()
        data = resp.json()
        articles = data["articles"] if isinstance(data, dict) else data
    except Exception as e:
        log.error(f"从生产 API 获取文章失败: {e}")
        return []

    articles.sort(key=lambda a: a.get("hot_score") or 0, reverse=True)
    result = []
    for art in articles:
        if art.get("source_url") and art["source_url"] in posted_urls:
            continue
        result.append(art)
        if len(result) >= limit:
            break

    return result


def mark_tg_posted(source_url: str) -> None:
    """标记文章已发 Telegram。"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        # tg_posted_at 列不存在则静默跳过
        cur.execute(
            "UPDATE articles SET tg_posted_at = NOW() WHERE source_url = %s",
            (source_url,),
        )
        conn.commit()
        cur.close()
        conn.close()
        log.info(f"已标记 tg_posted_at: {source_url[:60]}")
    except Exception as e:
        log.warning(f"标记 tg_posted_at 失败（可能列不存在）: {e}")


def build_message(articles: list[dict]) -> str:
    """构建 Telegram 消息（支持 HTML）。"""
    lines = ["🗞 <b>智讯Hub 科技早报</b>\n"]
    for i, art in enumerate(articles, 1):
        title = art.get("title", "").strip()
        share = (art.get("share_text") or "").strip()
        art_id = art.get("id")
        url = f"{SITE_URL}/article/{art_id}"

        # 每条新闻格式：序号 + 摘要 + 链接
        snippet = share if share else title
        # 截短超长摘要
        if len(snippet) > 80:
            snippet = snippet[:79] + "…"

        lines.append(f"{i}. <a href=\"{url}\">{title}</a>")
        if share:
            lines.append(f"   {snippet}")
        lines.append("")

    lines.append(f"📖 更多科技头条 👉 <a href=\"{SITE_URL}\">{SITE_URL}</a>")
    lines.append("#AI #科技 #Tech #智讯Hub")
    return "\n".join(lines)


def send_to_telegram(message: str) -> bool:
    """发送消息到 Telegram 频道。"""
    if not BOT_TOKEN or not CHANNEL_ID:
        log.error("Telegram Bot Token 或频道 ID 未配置，跳过")
        return False

    try:
        resp = httpx.post(
            f"{TG_API}/sendMessage",
            json={
                "chat_id": CHANNEL_ID,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": False,
            },
            timeout=15,
        )
        resp.raise_for_status()
        result = resp.json()
        if result.get("ok"):
            log.info(f"Telegram 发送成功！message_id={result['result']['message_id']}")
            return True
        else:
            log.error(f"Telegram 发送失败: {result}")
            return False
    except Exception as e:
        log.error(f"Telegram 请求失败: {e}")
        return False


def run_telegram_poster() -> None:
    log.info("=== 智讯 Hub Telegram Poster 启动 ===")

    if not BOT_TOKEN:
        log.error("TELEGRAM_BOT_TOKEN 未设置，退出")
        return
    if not CHANNEL_ID:
        log.error("TELEGRAM_CHANNEL_ID 未设置，退出")
        return

    articles = get_top_articles()
    if not articles:
        log.info("无新文章可发，跳过")
        return

    log.info(f"准备发送 {len(articles)} 篇文章到 Telegram")
    message = build_message(articles)
    ok = send_to_telegram(message)

    if ok:
        for art in articles:
            if art.get("source_url"):
                mark_tg_posted(art["source_url"])
        log.info(f"=== Telegram Poster 完成 ✓ ({len(articles)} 篇) ===")
    else:
        log.error("=== Telegram Poster 失败 ✗ ===")


if __name__ == "__main__":
    run_telegram_poster()
