#!/usr/bin/env python3
"""
智讯 Hub — 每日智讯内参自动发送
每天从数据库取过去 24 小时的精选文章，生成 HTML 邮件发给所有订阅者
"""

import os
import logging
import psycopg2
import httpx
from datetime import datetime, timedelta, timezone

log = logging.getLogger("newshub-newsletter")

MAILJET_API_KEY = os.environ.get("MAILJET_API_KEY", "")
MAILJET_SECRET_KEY = os.environ.get("MAILJET_SECRET_KEY", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")

FROM_EMAIL = "zhixunhub@gmail.com"
FROM_NAME = "智讯内参"
SITE_URL = "https://zhixunhub.com"
MAX_ARTICLES = 6


def get_db_conn():
    return psycopg2.connect(DATABASE_URL)


def fetch_recent_articles():
    """从数据库取过去 24 小时发布的精选文章，JOIN comments 取锐评"""
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT a.id, a.title, a.summary, c.content AS analyst_comment,
                       a.category, a.source_url, a.created_at
                FROM articles a
                LEFT JOIN comments c ON c.article_id = a.id
                WHERE a.created_at >= %s
                ORDER BY a.created_at DESC
                LIMIT %s
                """,
                (since, MAX_ARTICLES),
            )
            rows = cur.fetchall()
    return [
        {
            "id": r[0],
            "title": r[1],
            "summary": r[2],
            "analyst_comment": r[3],
            "category": r[4],
            "source_url": r[5],
            "source": _extract_source(r[5]),
            "published_at": r[6],
        }
        for r in rows
    ]


def _extract_source(url: str) -> str:
    """从 URL 提取媒体名称"""
    if not url:
        return ""
    SOURCE_MAP = {
        "techcrunch.com": "TechCrunch",
        "theverge.com": "The Verge",
        "wired.com": "Wired",
        "arstechnica.com": "Ars Technica",
        "venturebeat.com": "VentureBeat",
        "technologyreview.com": "MIT Tech Review",
    }
    for domain, name in SOURCE_MAP.items():
        if domain in url:
            return name
    return url.split("/")[2].replace("www.", "") if "//" in url else ""


def fetch_subscribers():
    """取所有订阅者邮箱"""
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT email FROM subscribers ORDER BY created_at ASC")
            rows = cur.fetchall()
    return [r[0] for r in rows]


def category_color(cat: str) -> str:
    colors = {
        "AI": "#7C3AED",
        "Technology": "#0066FF",
        "Business": "#059669",
        "Security": "#DC2626",
        "Health": "#D97706",
        "Policy": "#6B7280",
        "Space": "#0891B2",
    }
    return colors.get(cat, "#6B7280")


def build_article_block(article: dict) -> str:
    cat = article.get("category") or "Technology"
    color = category_color(cat)
    title = article.get("title") or "（无标题）"
    summary = article.get("summary") or ""
    comment = article.get("analyst_comment") or ""
    source = article.get("source") or ""
    article_url = f"{SITE_URL}/article/{article['id']}"
    source_url = article.get("source_url") or article_url

    # Truncate summary
    if len(summary) > 160:
        summary = summary[:157] + "..."

    analyst_block = ""
    if comment:
        comment_text = comment[:220] + "..." if len(comment) > 220 else comment
        analyst_block = f"""
        <tr>
          <td style="padding: 12px 16px; background: #f0f4ff; border-left: 3px solid {color}; border-radius: 0 6px 6px 0; margin-top: 8px; display: block;">
            <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: {color}; letter-spacing: 0.08em; text-transform: uppercase;">⚡ 智讯锐评</p>
            <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.6;">{comment_text}</p>
          </td>
        </tr>"""

    return f"""
    <tr>
      <td style="padding: 0 0 20px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 20px 20px 4px 20px;">
              <span style="display: inline-block; padding: 2px 10px; background: {color}18; color: {color}; font-size: 10px; font-weight: 700; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid {color}33;">{cat}</span>
              {f'<span style="font-size: 10px; color: #9ca3af; margin-left: 8px;">{source}</span>' if source else ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 20px 4px 20px;">
              <h2 style="margin: 0; font-size: 17px; font-weight: 700; color: #111827; line-height: 1.4;">{title}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 20px 12px 20px;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.65;">{summary}</p>
            </td>
          </tr>
          {analyst_block}
          <tr>
            <td style="padding: 12px 20px 16px 20px;">
              <a href="{article_url}" style="display: inline-block; padding: 7px 18px; background: linear-gradient(135deg, #0066FF, #0044CC); color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 8px;">深度阅读 →</a>
              {'<a href="' + source_url + '" style="display: inline-block; margin-left: 10px; padding: 7px 14px; color: #6b7280; font-size: 12px; text-decoration: none; border: 1px solid #d1d5db; border-radius: 8px;">原文</a>' if source_url else ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>"""


def build_html(articles: list, date_str: str) -> str:
    articles_html = "".join(build_article_block(a) for a in articles)
    count = len(articles)

    return f"""<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>智讯内参 · {date_str}</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 20px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 28px 32px;">
                    <div style="display: inline-block; background: rgba(0,102,255,0.08); border: 1px solid rgba(0,102,255,0.18); border-radius: 20px; padding: 4px 14px; margin-bottom: 16px;">
                      <span style="font-size: 11px; font-weight: 700; color: #0066FF; letter-spacing: 0.1em; text-transform: uppercase;">⚡ 智讯内参</span>
                    </div>
                    <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #111827;">今日科技精选</h1>
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">{date_str} · 精选 {count} 篇 · AI 深度解读</p>
                    <div style="margin-top: 20px; height: 1px; background: linear-gradient(90deg, transparent, #d1d5db, transparent);"></div>
                    <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                      过滤全球 6 大科技媒体 · 只留最值得关注的真相
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Articles -->
          {articles_html}

          <!-- Footer -->
          <tr>
            <td style="padding-top: 8px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 16px 0 4px 0; font-size: 12px; color: #6b7280;">
                <a href="{SITE_URL}" style="color: #0066FF; text-decoration: none; font-weight: 600;">智讯 Hub</a>
                · zhixunhub.com
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.7;">
                本邮件由系统自动生成，内容由 AI 基于 RSS 公开源处理生成<br>
                若要退订，请回复此邮件或发送邮件至
                <a href="mailto:zhixunhub@gmail.com" style="color: #6b7280;">zhixunhub@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_newsletter(recipients: list[str], html: str, subject: str) -> bool:
    if not MAILJET_API_KEY or not MAILJET_SECRET_KEY:
        log.error("MAILJET_API_KEY or MAILJET_SECRET_KEY not set, skipping newsletter")
        return False

    # Mailjet supports batch sending up to 50 recipients per request
    BATCH = 50
    success_count = 0
    fail_count = 0

    for i in range(0, len(recipients), BATCH):
        batch = recipients[i:i + BATCH]
        messages = [
            {
                "From": {"Email": FROM_EMAIL, "Name": FROM_NAME},
                "To": [{"Email": email}],
                "Subject": subject,
                "HTMLPart": html,
            }
            for email in batch
        ]
        try:
            resp = httpx.post(
                "https://api.mailjet.com/v3.1/send",
                auth=(MAILJET_API_KEY, MAILJET_SECRET_KEY),
                json={"Messages": messages},
                timeout=30,
            )
            data = resp.json()
            if resp.status_code in (200, 201):
                sent = sum(1 for m in data.get("Messages", []) if m.get("Status") == "success")
                failed = len(batch) - sent
                success_count += sent
                fail_count += failed
                if failed:
                    log.warning(f"Batch had {failed} failures: {data}")
            else:
                log.warning(f"Mailjet batch failed: {resp.status_code} {resp.text}")
                fail_count += len(batch)
        except Exception as e:
            log.error(f"Error sending batch: {e}")
            fail_count += len(batch)

    log.info(f"Newsletter sent: {success_count} success, {fail_count} failed")
    return success_count > 0


def run():
    log.info("=== Newsletter job starting ===")

    if not DATABASE_URL:
        log.error("DATABASE_URL not set, aborting")
        return

    articles = fetch_recent_articles()
    if not articles:
        log.info("No articles in the past 24 hours, skipping newsletter")
        return

    subscribers = fetch_subscribers()
    if not subscribers:
        log.info("No subscribers yet, skipping newsletter")
        return

    now = datetime.now()
    date_str = now.strftime("%Y年%m月%d日")
    subject = f"智讯内参 {date_str} · 今日精选 {len(articles)} 篇"

    html = build_html(articles, date_str)
    log.info(f"Sending newsletter to {len(subscribers)} subscribers ({len(articles)} articles)")
    send_newsletter(subscribers, html, subject)
    log.info("=== Newsletter job done ===")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    run()
