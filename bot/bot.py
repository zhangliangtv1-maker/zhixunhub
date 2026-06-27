#!/usr/bin/env python3
"""
智讯 Hub Bot v4 — RSS-based 多源并发抓取
来源：TechCrunch / The Verge / Wired / Ars Technica / VentureBeat / MIT Tech Review
AI：Gemini Flash（全中文摘要 + 智讯锐评）
存储：Replit PostgreSQL (psycopg2, DATABASE_URL)
"""

import os
import re
import json
import time
import logging
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx
import psycopg2

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("zhixun-bot")

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
DATABASE_URL   = os.environ["DATABASE_URL"]

ARTICLES_PER_SITE = 5
MAX_AGE_HOURS     = 48

SOURCES = [
    {"name": "TechCrunch",      "rss": "https://techcrunch.com/feed/"},
    {"name": "The Verge",       "rss": "https://www.theverge.com/rss/index.xml"},
    {"name": "Wired",           "rss": "https://www.wired.com/feed/rss"},
    {"name": "Ars Technica",    "rss": "https://feeds.arstechnica.com/arstechnica/index"},
    {"name": "VentureBeat",     "rss": "https://venturebeat.com/feed/"},
    {"name": "MIT Tech Review", "rss": "https://www.technologyreview.com/feed/"},
    {"name": "Reuters Tech",    "rss": "https://feeds.reuters.com/reuters/technologyNews"},
    {"name": "Bloomberg Tech",  "rss": "https://feeds.bloomberg.com/technology/news.rss"},
    {"name": "The Decoder",     "rss": "https://the-decoder.com/feed/"},
    {"name": "CNBC Tech",       "rss": "https://www.cnbc.com/id/19854910/device/rss/rss.html"},
    {"name": "Space.com",       "rss": "https://www.space.com/feeds/all"},
    {"name": "Stat News",       "rss": "https://www.statnews.com/feed/"},
]

GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
]

VALID_CATEGORIES = ["AI", "Technology", "Business", "Security",
                    "Health", "Policy", "Space"]


# ── RSS Parser ────────────────────────────────────────────────────────────────

def clean_html(html: str) -> str:
    """Strip HTML tags and decode common entities."""
    text = re.sub(r'<[^>]+>', ' ', html)
    for ent, ch in [('&amp;','&'),('&lt;','<'),('&gt;','>'),('&quot;','"'),('&apos;',"'"),('&#8230;','…')]:
        text = text.replace(ent, ch)
    text = re.sub(r'&#?\w+;', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _extract_rss_image(item) -> Optional[str]:
    """Try to find an image URL in an RSS/Atom item element."""
    MC = '{http://search.yahoo.com/mrss/}'
    # media:content
    for mc in item.iter(f'{MC}content'):
        url = mc.get('url', '')
        if url.startswith('http') and any(url.lower().endswith(ext) for ext in ('.jpg','.jpeg','.png','.webp','.gif')):
            return url
    # media:thumbnail
    for mt in item.iter(f'{MC}thumbnail'):
        url = mt.get('url', '')
        if url.startswith('http'):
            return url
    # enclosure
    enc = item.find('enclosure')
    if enc is not None:
        url = enc.get('url', '')
        t   = enc.get('type', '')
        if url.startswith('http') and 'image' in t:
            return url
    return None


def parse_rss(xml_text: str) -> list[dict]:
    """Parse RSS 2.0 or Atom feed, return list of {url, pubDate, title, content, image_url}."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=MAX_AGE_HOURS)
    items = []

    raw_xml = xml_text  # keep original for regex fallback
    xml_text = re.sub(r' xmlns[^"]*"[^"]*"', '', xml_text)
    xml_text = re.sub(r'<\?xml[^?]*\?>', '', xml_text).strip()

    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return _parse_rss_regex(raw_xml, cutoff)

    CONTENT_NS = '{http://purl.org/rss/1.0/modules/content/}'

    # RSS 2.0 items
    for item in root.iter('item'):
        url_el   = item.find('link')
        date_el  = item.find('pubDate') or item.find('{http://purl.org/dc/elements/1.1/}date')
        title_el = item.find('title')
        url      = (url_el.text or '').strip() if url_el is not None else ''
        date_str = (date_el.text or '').strip() if date_el is not None else ''
        title    = (title_el.text or '').strip() if title_el is not None else ''
        if not url or not url.startswith('http'): continue
        pub_date = _parse_date(date_str)
        if pub_date and pub_date < cutoff: continue

        # Extract body: prefer content:encoded > description
        content_el = item.find(f'{CONTENT_NS}encoded') or item.find('description')
        content = clean_html((content_el.text or '') if content_el is not None else '')

        image_url = _extract_rss_image(item)
        items.append({'url': url, 'pubDate': pub_date, 'title': title,
                      'content': content, 'image_url': image_url})

    # Atom entries
    if not items:
        for entry in root.iter('entry'):
            link_el  = entry.find('link')
            date_el  = entry.find('published') or entry.find('updated')
            title_el = entry.find('title')
            url = ''
            if link_el is not None:
                url = link_el.get('href', link_el.text or '').strip()
            if not url or not url.startswith('http'): continue
            date_str = (date_el.text or '').strip() if date_el is not None else ''
            title    = (title_el.text or '').strip() if title_el is not None else ''
            pub_date = _parse_date(date_str)
            if pub_date and pub_date < cutoff: continue

            content_el = entry.find('content') or entry.find('summary')
            content = clean_html((content_el.text or '') if content_el is not None else '')
            image_url = _extract_rss_image(entry)
            items.append({'url': url, 'pubDate': pub_date, 'title': title,
                          'content': content, 'image_url': image_url})

    return items


def _parse_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        from dateutil import parser as dateparser
        d = dateparser.parse(date_str)
        if d and d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d
    except Exception:
        return None


def _parse_rss_regex(text: str, cutoff: datetime) -> list[dict]:
    """Fallback regex RSS parser."""
    items = []
    item_re = re.compile(r'<(?:item|entry)>([\s\S]*?)</(?:item|entry)>')
    for m in item_re.finditer(text):
        block = m.group(1)
        url_m     = re.search(r'<link>([^<]+)</link>', block) or re.search(r'<link[^>]+href="([^"]+)"', block)
        date_m    = re.search(r'<pubDate>([^<]+)</pubDate>', block) or re.search(r'<published>([^<]+)</published>', block)
        title_m   = re.search(r'<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</title>', block)
        content_m = re.search(r'<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</content:encoded>', block) \
                 or re.search(r'<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</description>', block) \
                 or re.search(r'<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</summary>', block)
        image_m   = re.search(r'media:(?:content|thumbnail)[^>]+url="([^"]+)"', block) \
                 or re.search(r'<enclosure[^>]+url="([^"]+)"[^>]+type="image', block)
        if not url_m: continue
        url = url_m.group(1).strip().replace('&amp;', '&')
        if not url.startswith('http'): continue
        pub_date = _parse_date(date_m.group(1).strip()) if date_m else None
        if pub_date and pub_date < cutoff: continue
        title   = (title_m.group(1) or '').strip() if title_m else ''
        content = clean_html((content_m.group(1) or '').strip()) if content_m else ''
        image_url = image_m.group(1).strip() if image_m else None
        items.append({'url': url, 'pubDate': pub_date, 'title': title,
                      'content': content, 'image_url': image_url})
    return items


def fetch_rss(feed_url: str) -> list[dict]:
    try:
        resp = httpx.get(
            feed_url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; ZhixunBot/4.0)"},
            timeout=15,
            follow_redirects=True,
        )
        resp.raise_for_status()
        items = parse_rss(resp.text)
        log.info(f"RSS 抓取成功 {feed_url}: {len(items)} 篇近期文章")
        return items
    except Exception as e:
        log.error(f"RSS 抓取失败 {feed_url}: {e}")
        return []


def firecrawl_scrape(url: str) -> Optional[dict]:
    try:
        resp = httpx.post(
            "https://api.firecrawl.dev/v1/scrape",
            headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}", "Content-Type": "application/json"},
            json={"url": url, "formats": ["markdown"], "onlyMainContent": True},
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("data") if data.get("success") else None
    except Exception as e:
        log.error(f"Firecrawl scrape 失败 {url}: {e}")
        return None


def extract_image_url(scraped: dict) -> Optional[str]:
    meta = scraped.get("metadata", {})
    for key in ("ogImage", "og:image", "leadImage", "lead_image", "twitter:image", "twitterImage", "image"):
        val = meta.get(key)
        if val and isinstance(val, str) and val.startswith("http"):
            return val.split("?")[0]
    return None


# ── Gemini ───────────────────────────────────────────────────────────────────

def _gemini_post(prompt: str, temperature: float = 0.4, max_tokens: int = 4096) -> Optional[str]:
    for model in GEMINI_MODELS:
        try:
            resp = httpx.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
                },
                timeout=45,
            )
            if resp.status_code in (400, 404):
                log.warning(f"Gemini {model} {resp.status_code}")
                continue
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            log.warning(f"Gemini {model} 错误: {e}")
            continue
    log.error("所有 Gemini 模型均失败")
    return None


def _parse_json(text: str) -> Optional[dict]:
    try:
        s = text.strip()
        if s.startswith("```"):
            parts = s.split("```")
            s = parts[1] if len(parts) > 1 else s
            if s.startswith("json"):
                s = s[4:]
        s = s.strip().rstrip("```").strip()
        return json.loads(s)
    except json.JSONDecodeError:
        m = re.search(r'\{[\s\S]*\}', text)
        if m:
            try:
                return json.loads(m.group())
            except json.JSONDecodeError:
                pass
    return None


def gemini_process_article(title: str, content: str, source_name: str) -> Optional[dict]:
    log.info(f"Gemini 处理: {title[:60]}")
    prompt = f"""你是智讯 Hub 的首席科技编辑。请将以下来自 {source_name} 的英文科技文章转化为中文内参，返回纯 JSON 对象。

原文标题：{title}
原文正文：
{content[:6000]}

返回格式（纯 JSON，禁止输出 markdown 代码块或任何解释文字）：
{{"title":"抓人眼球的中文标题：要有冲击力和观点，让读者一眼就想点进来；可以用「竟然」「终于」「为什么」「真相」「正在改变」等情绪词，但必须忠于原文事实；可保留品牌名/产品名等专有名词，但整体必须是中文句子","summary":"200字左右的中文摘要，专业精炼，涵盖核心事件、关键数据和市场意义","content":"400-600字的中文深度拆解：包括【背景与来龙去脉】【核心事件与关键细节】【行业影响与深层逻辑】三个维度，用流畅中文写成连续段落，不要用标题分节，保留公司名/人名/技术术语等英文专有名词","category":"以下之一：AI / Technology / Startups / Business / Science / Security / Finance / Health / Policy / Space","share_text":"一句25字以内的中文分享语，适合直接发到朋友圈或微信群，要有观点和情绪感，让看到的人也想点进来看，不得是标题的简单重复"}}

强制规则：
1. title 必须是地道中文句子，不能是英文句子的直接保留；标题中可含 OpenAI、Apple、Tesla 等品牌名，但整体结构必须是中文；标题要有吸引力，让人想点击
2. summary 和 content 全部用中文输出
3. content 必须基于原文事实进行分析，严禁虚构原文未提及的数据、细节或观点；若原文信息有限，只分析有据可查的部分，不得填充臆测内容
4. category 必须完全匹配上述英文选项之一
5. share_text 必须是一句完整的话，25字以内，有传播力
6. 输出纯 JSON，不加任何 markdown 格式"""

    text = _gemini_post(prompt, temperature=0.3, max_tokens=4096)
    if not text:
        return None
    result = _parse_json(text)
    if not result:
        log.error(f"Gemini 返回无效 JSON: {text[:200]}")
    return result


def gemini_generate_commentary(title: str, summary: str) -> Optional[str]:
    log.info(f"生成智讯锐评: {title[:60]}")
    prompt = f"""你是智讯 Hub 首席分析师，以犀利著称，擅长在科技新闻背后挖掘别人看不见的产业逻辑。

请针对以下新闻，写一段100到150字的中文锐评。必须严格按照以下三层结构展开（但不要写标题或分节符号，直接写成一整段流畅的中文）：
1. 现象分析：这件事的本质是什么，不要复述新闻，要给出你的判断
2. 行业影响：对竞争格局、上下游、或资本市场意味着什么
3. 独家洞察：给出一个旁人未必想到的预判或警示

语气要求：直接、锐利、有立场，敢于给出明确观点，杜绝"值得关注""仍需观察"之类的废话套话。可保留公司名、人名等英文专有名词。开头直接进入正文，不要任何前缀。字数严格控制在100到150字之间，句子必须写完整，不得截断。

标题：{title}
摘要：{summary}"""

    return _gemini_post(prompt, temperature=0.75, max_tokens=800)


# ── Database ──────────────────────────────────────────────────────────────────

def get_db():
    return psycopg2.connect(DATABASE_URL)


def article_exists(conn, url: str) -> bool:
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM articles WHERE source_url = %s LIMIT 1", (url,))
        return cur.fetchone() is not None


def save_article(conn, data: dict, source_url: str, image_url: Optional[str]) -> Optional[int]:
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO articles (title, source_url, summary, content, category, image_url, share_text)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (source_url) DO NOTHING
                   RETURNING id""",
                (
                    data.get("title", "Untitled"),
                    source_url,
                    data.get("summary"),
                    data.get("content"),
                    data.get("category", "Technology"),
                    image_url,
                    data.get("share_text"),
                ),
            )
            row = cur.fetchone()
            conn.commit()
            if row:
                log.info(f"已保存文章 ID={row[0]}: {data.get('title','')[:60]}")
                log.info(f"  image_url: {image_url}")
                return row[0]
            log.info(f"重复跳过: {source_url}")
            return None
    except Exception as e:
        conn.rollback()
        log.error(f"保存文章失败: {e}")
        return None


def save_comment(conn, article_id: int, text: str) -> None:
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO comments (article_id, commenter_name, content) VALUES (%s, %s, %s)",
                (article_id, "智讯 Hub 首席分析师", text),
            )
            conn.commit()
            log.info(f"已保存智讯锐评 article_id={article_id}")
    except Exception as e:
        conn.rollback()
        log.error(f"保存锐评失败: {e}")


# ── Per-site worker ───────────────────────────────────────────────────────────

def process_site(source: dict, conn) -> dict:
    name     = source["name"]
    rss_url  = source["rss"]
    stats    = {"site": name, "processed": 0, "skipped": 0, "failed": 0}

    log.info(f"=== 开始处理 {name} ===")

    rss_items = fetch_rss(rss_url)
    if not rss_items:
        log.warning(f"{name} RSS 无近期文章")
        return stats

    EXCLUDE_PATTERNS = [
        "/the-download/", "the-download-", "/download-", "/newsletter/",
        "/weekly-", "/roundup/", "/digest/", "/this-week/", "/recap/",
        "-deals-", "-deal-", "-coupon", "-promo-", "-discount", "-savings-",
        "/deals/", "/coupons/", "/best-", "/book-excerpt", "/gift-guide",
        "/2023/", "/2022/", "/2021/", "/2020/", "/2019/",
    ]

    new_items = []
    for item in rss_items:
        if len(new_items) >= ARTICLES_PER_SITE:
            break
        url_lower = item["url"].lower()
        if any(p in url_lower for p in EXCLUDE_PATTERNS):
            log.info(f"跳过彙整文章: {item['url']}")
            stats["skipped"] += 1
            continue
        if article_exists(conn, item["url"]):
            stats["skipped"] += 1
        else:
            new_items.append(item)

    log.info(f"[{name}] 待处理 {len(new_items)} 篇（跳过重复 {stats['skipped']} 篇）")

    for item in new_items:
        url = item["url"]
        try:
            raw_content = item.get("content", "")
            raw_title   = item.get("title") or "Untitled"
            image_url   = item.get("image_url")

            if len(raw_content) < 100:
                log.info(f"RSS 内容过短（{len(raw_content)} 字符），跳过: {url}")
                stats["failed"] += 1
                continue

            processed = gemini_process_article(raw_title, raw_content, name)
            if not processed:
                stats["failed"] += 1
                continue

            article_id = save_article(conn, processed, url, image_url)
            if not article_id:
                stats["skipped"] += 1
                continue

            commentary = gemini_generate_commentary(
                processed.get("title", raw_title),
                processed.get("summary", ""),
            )
            if commentary:
                save_comment(conn, article_id, commentary)

            stats["processed"] += 1
            time.sleep(1.0)

        except Exception as e:
            log.error(f"处理 {url} 出错: {e}")
            stats["failed"] += 1

    log.info(f"=== {name} 完成: {stats} ===")
    return stats


# ── Main ─────────────────────────────────────────────────────────────────────

def run_bot():
    log.info("=== 智讯 Hub Bot v4 (RSS) 启动 ===")
    log.info(f"来源: {[s['name'] for s in SOURCES]}，每站 {ARTICLES_PER_SITE} 篇，时间窗口 {MAX_AGE_HOURS}h")

    total_stats = {"processed": 0, "skipped": 0, "failed": 0}

    def run_site(source):
        conn = get_db()
        try:
            return process_site(source, conn)
        finally:
            conn.close()

    with ThreadPoolExecutor(max_workers=len(SOURCES)) as executor:
        futures = {executor.submit(run_site, src): src["name"] for src in SOURCES}
        for future in as_completed(futures):
            site_name = futures[future]
            try:
                stats = future.result()
                total_stats["processed"] += stats["processed"]
                total_stats["skipped"]   += stats["skipped"]
                total_stats["failed"]    += stats["failed"]
            except Exception as e:
                log.error(f"{site_name} 线程崩溃: {e}")

    log.info(
        f"=== Bot 完成。总计: 新增={total_stats['processed']}, "
        f"跳过={total_stats['skipped']}, 失败={total_stats['failed']} ==="
    )
    regenerate_sitemap()


def regenerate_sitemap():
    """从数据库读取所有文章，重新生成静态 sitemap.xml"""
    DOMAIN = "https://zhixunhub.com"
    STATIC_PAGES = [
        {"loc": "/",           "changefreq": "hourly",  "priority": "1.0"},
        {"loc": "/categories", "changefreq": "daily",   "priority": "0.8"},
        {"loc": "/about",      "changefreq": "monthly", "priority": "0.5"},
    ]

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, created_at FROM articles ORDER BY created_at DESC")
        articles = cur.fetchall()
        cur.close()
        conn.close()

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        static_entries = "".join(
            f"\n  <url>\n    <loc>{DOMAIN}{p['loc']}</loc>\n    <lastmod>{today}</lastmod>\n"
            f"    <changefreq>{p['changefreq']}</changefreq>\n    <priority>{p['priority']}</priority>\n  </url>"
            for p in STATIC_PAGES
        )

        article_entries = "".join(
            f"\n  <url>\n    <loc>{DOMAIN}/article/{row[0]}</loc>\n"
            f"    <lastmod>{row[1].strftime('%Y-%m-%d') if row[1] else today}</lastmod>\n"
            f"    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>"
            for row in articles
        )

        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            f"{static_entries}{article_entries}\n</urlset>"
        )

        script_dir = os.path.dirname(os.path.abspath(__file__))
        out_path = os.path.join(script_dir, "..", "artifacts", "news-hub", "public", "sitemap.xml")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(xml)

        log.info(f"Sitemap 已更新：{len(articles)} 篇文章 → {os.path.abspath(out_path)}")

    except Exception as e:
        log.error(f"Sitemap 生成失败: {e}")


if __name__ == "__main__":
    run_bot()
