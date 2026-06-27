#!/usr/bin/env python3
"""
智讯 Hub Social Poster
每天自动挑选热门文章，直接上传配图发到 X，不依赖 OG 卡片缓存。
"""

import os
import io
import time
import logging
import tempfile
import psycopg2
import httpx
import tweepy

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("social-poster")

DATABASE_URL          = os.environ["DATABASE_URL"]
X_API_KEY             = os.environ.get("X_API_KEY")
X_API_SECRET          = os.environ.get("X_API_SECRET")
X_ACCESS_TOKEN        = os.environ.get("X_ACCESS_TOKEN")
X_ACCESS_TOKEN_SECRET = os.environ.get("X_ACCESS_TOKEN_SECRET")
SUPABASE_URL          = os.environ.get("SUPABASE_URL")
SUPABASE_KEY          = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
def _load_fb_token() -> str | None:
    """Load Facebook Page Token: local file takes priority over env var.
    Also strips an extra 'A' that the Replit Secrets UI sometimes prepends."""
    # 1. Try local token file (bypasses Secrets UI corruption)
    token_file = os.path.join(os.path.dirname(__file__), ".fb_token")
    if os.path.exists(token_file):
        t = open(token_file).read().strip()
        if t:
            return t
    # 2. Fall back to environment variable, fixing extra-A corruption
    t = os.environ.get("FACEBOOK_PAGE_TOKEN")
    if t and t.startswith("EAAAU"):
        return "EAA" + t[4:]
    return t

FB_PAGE_TOKEN         = _load_fb_token()
FB_PAGE_ID            = os.environ.get("FACEBOOK_PAGE_ID")
IG_USER_TOKEN         = os.environ.get("INSTAGRAM_USER_TOKEN")

SITE_URL    = "https://zhixunhub.com"
FB_GRAPH    = "https://graph.facebook.com/v21.0"
IG_GRAPH    = "https://graph.instagram.com/v21.0"

# Instagram User ID (auto-fetched via IGAAV token from graph.instagram.com/me)
_IG_ACCOUNT_ID_CACHE: str | None = None

def get_ig_account_id() -> str | None:
    """Fetch Instagram User ID via IGAAV token (new Instagram API)."""
    global _IG_ACCOUNT_ID_CACHE
    if _IG_ACCOUNT_ID_CACHE:
        return _IG_ACCOUNT_ID_CACHE

    # New Instagram API uses IGAAV token + graph.instagram.com/me
    if IG_USER_TOKEN:
        try:
            resp = httpx.get(
                f"{IG_GRAPH}/me",
                params={"fields": "id,username", "access_token": IG_USER_TOKEN},
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            ig_id = data.get("id")
            if ig_id:
                _IG_ACCOUNT_ID_CACHE = ig_id
                log.info(f"Instagram User ID: {ig_id} (@{data.get('username')})")
                return _IG_ACCOUNT_ID_CACHE
        except Exception as e:
            log.warning(f"無法從 IGAAV token 取得帳號 ID: {e}")

    # Fallback: FB token debug_token granular_scopes (old API, FB-side ID)
    fb_token = FB_PAGE_TOKEN
    if fb_token:
        try:
            resp = httpx.get(
                f"{FB_GRAPH}/debug_token",
                params={"input_token": fb_token, "access_token": fb_token},
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json().get("data", {})
            for scope in data.get("granular_scopes", []):
                if scope.get("scope") == "instagram_content_publish":
                    targets = scope.get("target_ids", [])
                    if targets:
                        _IG_ACCOUNT_ID_CACHE = targets[0]
                        log.info(f"Instagram Account ID (FB fallback): {_IG_ACCOUNT_ID_CACHE}")
                        return _IG_ACCOUNT_ID_CACHE
        except Exception as e:
            log.warning(f"FB debug_token 查詢失敗: {e}")

    return None

# 分类备用图（与 og.ts 保持一致）
UNSPLASH_FALLBACK: dict[str, str] = {
    "AI":         "photo-1677442135703-1787eea5ce01",
    "Technology": "photo-1518770660439-4636190af475",
    "Business":   "photo-1507679799987-c73779587ccf",
    "Security":   "photo-1550751827-4bd374c3f58b",
    "Health":     "photo-1559757148-5c350d0d3c56",
    "Policy":     "photo-1529107386315-e1a2ed48a620",
    "Space":      "photo-1446776877081-d282a0f896e2",
}
DEFAULT_PHOTO = "photo-1504711434969-e33886168f5c"


def get_posted_source_urls() -> set[str]:
    """从本地 DB 取已发推的 source_url 集合。"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur  = conn.cursor()
        cur.execute("SELECT source_url FROM articles WHERE x_posted_at IS NOT NULL AND source_url IS NOT NULL")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {r[0] for r in rows}
    except Exception as e:
        log.warning(f"读取已发推记录失败（将允许全部文章发推）: {e}")
        return set()


def mark_x_posted_by_source_url(source_url: str) -> None:
    """在本地 DB 中按 source_url 标记文章已发推。"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur  = conn.cursor()
        cur.execute(
            "UPDATE articles SET x_posted_at = NOW() WHERE source_url = %s",
            (source_url,),
        )
        conn.commit()
        cur.close()
        conn.close()
        log.info(f"已标记 x_posted_at: {source_url[:60]}")
    except Exception as e:
        log.error(f"标记 x_posted_at 失败: {e}")


def _fetch_articles_from_local_db() -> list[dict]:
    """本地 DB 备援：生产 API 不可用时直接查本地 PostgreSQL。"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur  = conn.cursor()
        cur.execute("""
            SELECT id, title, source_url, category, image_url,
                   COALESCE(views, 0) AS hot_score, share_text
            FROM articles
            WHERE title IS NOT NULL
            ORDER BY views DESC NULLS LAST, created_at DESC
            LIMIT 50
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        cur.close()
        conn.close()
        # 标记来源，用于链接构建时降级到 source_url
        for r in rows:
            r["_local_fallback"] = True
        log.info(f"本地 DB 备援：获取 {len(rows)} 篇文章")
        return rows
    except Exception as e:
        log.error(f"本地 DB 备援也失败: {e}")
        return []


def get_top_article() -> dict | None:
    """
    从生产 API 获取热门文章列表，跳过本地 DB 中已发过的（按 source_url 判断）。
    若生产 API 不可用，自动回退到 Supabase REST API。
    """
    posted_urls = get_posted_source_urls()
    articles = []

    # 1. 尝试生产 API
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
        log.info(f"生产 API 返回 {len(articles)} 篇文章")
    except Exception as e:
        log.warning(f"生产 API 失败，切换到本地 DB 备援: {e}")
        articles = _fetch_articles_from_local_db()

    if not articles:
        log.info("无新文章或全部已发过，跳过")
        return None

    # 按 hot_score 降序选第一篇未发过的
    articles.sort(key=lambda a: a.get("hot_score") or 0, reverse=True)
    for art in articles:
        if art.get("source_url") and art["source_url"] in posted_urls:
            continue
        log.info(f"选中文章 ID={art['id']}: {art['title'][:60]}")
        return art

    log.info("所有文章均已发推，跳过")
    return None


CATEGORY_HASHTAGS: dict[str, list[str]] = {
    "AI":           ["#AI", "#人工智能", "#科技"],
    "Tech":         ["#科技", "#Tech", "#数码"],
    "Business":     ["#科技商业", "#Tech", "#创投"],
    "Science":      ["#科学", "#Science", "#科技"],
    "Space":        ["#太空", "#Space", "#航天"],
    "Security":     ["#网络安全", "#Cybersecurity", "#科技"],
    "Policy":       ["#科技政策", "#AI", "#科技"],
    "Health":       ["#健康科技", "#HealthTech", "#科技"],
    "Startups":     ["#创业", "#Startup", "#科技"],
    "Gadgets":      ["#数码", "#科技", "#Tech"],
}
DEFAULT_HASHTAGS = ["#科技", "#AI", "#Tech"]


def build_hashtags(article: dict) -> str:
    """根据文章分类返回 2-3 个标签字符串。"""
    cat = (article.get("category") or "").strip()
    tags = CATEGORY_HASHTAGS.get(cat, DEFAULT_HASHTAGS)
    return " ".join(tags)


def build_tweet(article: dict) -> str:
    """主推文：share_text + 标题 + 分类标签，不含 URL。"""
    share_text = (article.get("share_text") or "").strip()
    title      = (article.get("title") or "").strip()
    hashtags   = build_hashtags(article)

    body = f"{share_text}\n\n{title}" if share_text else title

    # 加标签，保持总长度 ≤ 280
    full = f"{body}\n\n{hashtags}"
    if len(full) <= 280:
        return full
    # 超长则截短正文
    max_body = 280 - len(hashtags) - 3
    return f"{body[:max_body]}…\n\n{hashtags}"


def get_article_link(article: dict) -> str:
    """返回文章链接：生产 API 正常时用网站 ID 链接，本地备援时用原始 source_url。"""
    if article.get("_local_fallback") and article.get("source_url"):
        return article["source_url"]
    return f"{SITE_URL}/article/{article['id']}"


def build_reply(article: dict) -> str:
    """回复推文：只含文章链接，让用户可以点击跳转。"""
    return f"阅读全文 👉 {get_article_link(article)}"


def get_image_url(article: dict) -> str:
    """返回文章图片 URL；无原图则用分类备用图。"""
    if article.get("image_url"):
        return article["image_url"]
    photo_id = UNSPLASH_FALLBACK.get(article.get("category") or "", DEFAULT_PHOTO)
    return f"https://images.unsplash.com/{photo_id}?w=1200&h=630&fit=crop&auto=format"


def download_image(url: str) -> tuple[bytes, str] | None:
    """下载图片，返回 (字节流, 扩展名)。跳过 GIF（X 不支持动图上传）。"""
    try:
        resp = httpx.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; ZhixunBot/4.0)"},
            timeout=20,
            follow_redirects=True,
        )
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "").lower()
        if "image" not in content_type:
            log.warning(f"URL 返回非图片内容: {content_type}")
            return None
        # X 不接受 GIF 作为普通图片上传，跳过
        if "gif" in content_type or url.lower().endswith(".gif"):
            log.warning(f"跳过 GIF 图片（X 不支持）: {url[:60]}")
            return None
        # 确定扩展名
        if "png" in content_type:
            ext = ".png"
        elif "webp" in content_type:
            ext = ".jpg"  # webp 转 jpg 副档名（内容不变，X 能处理）
        else:
            ext = ".jpg"
        log.info(f"图片下载成功: {len(resp.content)} bytes ({url[:60]})")
        return resp.content, ext
    except Exception as e:
        log.warning(f"图片下载失败 {url}: {e}")
        return None


def upload_media(image_data: tuple[bytes, str]) -> str | None:
    """用 v1.1 API 上传图片到 X，返回 media_id。"""
    try:
        image_bytes, ext = image_data
        auth = tweepy.OAuth1UserHandler(
            X_API_KEY, X_API_SECRET,
            X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET,
        )
        api_v1 = tweepy.API(auth)
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name
        media = api_v1.media_upload(filename=tmp_path)
        os.unlink(tmp_path)
        log.info(f"图片上传成功: media_id={media.media_id_string}")
        return media.media_id_string
    except Exception as e:
        log.warning(f"图片上传失败: {e}")
        return None


def post_to_x(article: dict) -> bool:
    """发推文（含配图），失败自动重试 3 次。"""
    if not all([X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET]):
        log.error("X API 密钥未配置，跳过发推")
        return False

    tweet_text = build_tweet(article)
    log.info(f"准备发推:\n{tweet_text}")

    # 始终上传图片（原图优先，无原图用分类备用图）
    img_url = get_image_url(article)
    log.info(f"使用图片: {img_url[:80]}")
    image_bytes = download_image(img_url)
    media_id = upload_media(image_bytes) if image_bytes else None

    if media_id:
        log.info("将以配图模式发推")
    else:
        log.warning("图片上传失败，改为纯文字模式")

    client = tweepy.Client(
        consumer_key=X_API_KEY,
        consumer_secret=X_API_SECRET,
        access_token=X_ACCESS_TOKEN,
        access_token_secret=X_ACCESS_TOKEN_SECRET,
    )

    for attempt in range(1, 4):
        try:
            # 主推文：文字 + 图片，无 URL（避免 OG 卡片缓存干扰）
            kwargs: dict = {"text": tweet_text}
            if media_id:
                kwargs["media_ids"] = [media_id]
            response = client.create_tweet(**kwargs)
            tweet_id = response.data["id"]
            log.info(f"X 主推成功! tweet_id={tweet_id}")

            # 回复推文：仅含文章链接
            reply_text = build_reply(article)
            try:
                client.create_tweet(
                    text=reply_text,
                    in_reply_to_tweet_id=tweet_id,
                )
                log.info(f"回复链接发送成功: {reply_text}")
            except Exception as re:
                log.warning(f"回复链接失败（不影响主推文）: {re}")

            log.info(f"推文串: https://x.com/i/web/status/{tweet_id}")
            return True
        except tweepy.TweepyException as e:
            err_str = str(e)
            # 402 = 月度免费额度用完，无需重试，等下月1日自动重置
            if "402" in err_str or "Payment Required" in err_str:
                log.info("X 免费额度已用完（402），跳过本次发推，下月1日自动重置")
                return False
            log.warning(f"X 发推失败（第 {attempt}/3 次）: {e}")
            if attempt < 3:
                wait = attempt * 10
                log.info(f"等待 {wait} 秒后重试...")
                time.sleep(wait)

    log.error("X 发推失败，已重试 3 次放弃")
    return False


def get_fb_page_token() -> str | None:
    """返回专页 Token（FACEBOOK_PAGE_TOKEN 应直接存储永久 Page Token）。"""
    if not FB_PAGE_TOKEN:
        return None
    return FB_PAGE_TOKEN


def post_to_facebook(article: dict) -> bool:
    """向 Facebook 专页发布文章。有图直接上传图片，无图用链接卡片。"""
    if not FB_PAGE_TOKEN or not FB_PAGE_ID:
        log.info("Facebook 未配置，跳过")
        return False

    page_token = get_fb_page_token()
    if not page_token:
        log.error("无法获取 Facebook 专页 Token，跳过")
        return False

    article_url = get_article_link(article)
    share_text  = (article.get("share_text") or "").strip()
    title       = (article.get("title") or "").strip()
    hashtags    = build_hashtags(article)
    message     = f"{share_text if share_text else title}\n\n{hashtags}\n\n{article_url}"

    try:
        # 优先：直接上传图片（不依赖生产站 OG 爬取）
        img_url = get_image_url(article)
        img_data = download_image(img_url) if img_url else None
        if img_data:
            img_bytes, img_ext = img_data
            # 上传图片到 Facebook，同时发布为主帖
            photo_resp = httpx.post(
                f"{FB_GRAPH}/{FB_PAGE_ID}/photos",
                data={
                    "caption":      message,
                    "published":    "true",
                    "access_token": page_token,
                },
                files={"source": (f"image.{img_ext}", img_bytes, f"image/{img_ext}")},
                timeout=60,
            )
            photo_resp.raise_for_status()
            post_id = photo_resp.json().get("id")
            log.info(f"Facebook 发布成功（图片直传）! post_id={post_id}")
            return True
    except Exception as e:
        log.warning(f"Facebook 图片上传失败，回退到链接模式: {e}")

    try:
        # 回退：无图或上传失败时，用链接卡片
        # 本地备援时用 source_url，避免生产站 ID 不匹配
        if article.get("_local_fallback") and article.get("source_url"):
            link_url = article["source_url"]
        else:
            link_url = f"{SITE_URL}/api/og/{article['id']}"
        feed_resp = httpx.post(
            f"{FB_GRAPH}/{FB_PAGE_ID}/feed",
            data={
                "message":      f"{share_text if share_text else title}\n\n{hashtags}",
                "link":         link_url,
                "access_token": page_token,
            },
            timeout=30,
        )
        feed_resp.raise_for_status()
        post_id = feed_resp.json().get("id")
        log.info(f"Facebook 发布成功（链接模式）! post_id={post_id}")
        return True
    except Exception as e:
        log.error(f"Facebook 发布失败: {e}")
        if hasattr(e, "response") and e.response is not None:  # type: ignore[union-attr]
            log.error(f"FB API 响应: {e.response.text}")  # type: ignore[union-attr]
        return False


def build_ig_caption(article: dict) -> str:
    """Instagram 貼文內容：share_text + 標題 + 標籤 + 連結。"""
    share_text = (article.get("share_text") or "").strip()
    title      = (article.get("title") or "").strip()
    hashtags   = build_hashtags(article)
    article_url = get_article_link(article)
    body = f"{share_text}\n\n{title}" if share_text else title
    return f"{body}\n\n{hashtags}\n\n🔗 {article_url}"


def post_to_instagram(article: dict) -> bool:
    """向 Instagram 商業帳號發布圖文貼文（新版 Instagram Graph API）。"""
    ig_id = get_ig_account_id()
    if not ig_id:
        log.info("Instagram 未設定，跳過")
        return False

    # 新版 Instagram API 使用 IGAAV token + graph.instagram.com
    token = IG_USER_TOKEN
    if not token:
        log.info("INSTAGRAM_USER_TOKEN 未設定，跳過 Instagram")
        return False

    img_url = get_image_url(article)
    caption = build_ig_caption(article)
    log.info(f"Instagram 準備發文 (新版 API)，IG ID: {ig_id}，圖片: {img_url[:80]}")

    try:
        # 第一步：建立媒體容器
        create_resp = httpx.post(
            f"{IG_GRAPH}/{ig_id}/media",
            data={
                "image_url":    img_url,
                "caption":      caption,
                "access_token": token,
            },
            timeout=30,
        )
        create_resp.raise_for_status()
        creation_id = create_resp.json().get("id")
        if not creation_id:
            log.error(f"Instagram 媒體容器建立失敗: {create_resp.text}")
            return False
        log.info(f"Instagram 媒體容器建立成功: creation_id={creation_id}")

        # 等待媒體處理完成
        time.sleep(3)

        # 第二步：發布媒體容器
        publish_resp = httpx.post(
            f"{IG_GRAPH}/{ig_id}/media_publish",
            data={
                "creation_id":  creation_id,
                "access_token": token,
            },
            timeout=30,
        )
        publish_resp.raise_for_status()
        post_id = publish_resp.json().get("id")
        log.info(f"Instagram 發文成功! post_id={post_id}")
        return True

    except Exception as e:
        log.error(f"Instagram 發文失敗: {e}")
        if hasattr(e, "response") and e.response is not None:  # type: ignore[union-attr]
            log.error(f"IG API 響應: {e.response.text}")  # type: ignore[union-attr]
        return False


def last_posted_minutes_ago() -> float | None:
    """返回距离上次发推的分钟数，若从未发过则返回 None。"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur  = conn.cursor()
        cur.execute(
            "SELECT MAX(x_posted_at) FROM articles WHERE x_posted_at IS NOT NULL"
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row and row[0]:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            last = row[0]
            if last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            return (now - last).total_seconds() / 60
    except Exception as e:
        log.warning(f"检查上次发推时间失败: {e}")
    return None


COOLDOWN_MINUTES = 90  # 1.5h — 防止重启/catch-up导致短时间重复发文，但不影响正常6h slot


def run_social_poster() -> None:
    log.info("=== 智讯 Hub Social Poster 启动 ===")

    # 冷却期检查：防止调度器重启导致重复发文
    minutes_ago = last_posted_minutes_ago()
    if minutes_ago is not None and minutes_ago < COOLDOWN_MINUTES:
        log.info(
            f"距上次发推仅 {minutes_ago:.0f} 分钟（冷却期 {COOLDOWN_MINUTES} 分钟），跳过本次"
        )
        return

    article = get_top_article()
    if not article:
        log.info("无新文章或全部已发过，跳过")
        return

    log.info(f"选中文章 ID={article['id']}: {article['title'][:60]}")

    x_ok  = post_to_x(article)
    fb_ok = post_to_facebook(article)
    ig_ok = post_to_instagram(article)

    if x_ok or fb_ok or ig_ok:
        mark_x_posted_by_source_url(article.get("source_url", ""))
        log.info(
            f"=== Social Poster 完成 "
            f"(X={'✓' if x_ok else '✗'}, "
            f"FB={'✓' if fb_ok else '✗'}, "
            f"IG={'✓' if ig_ok else '✗'}) ==="
        )


if __name__ == "__main__":
    run_social_poster()
