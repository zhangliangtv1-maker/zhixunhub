import { useParams, useLocation } from "wouter";
import {
  useGetArticle, useListComments, useGetAdjacentArticles,
  getGetArticleQueryKey, getListCommentsQueryKey, getGetAdjacentArticlesQueryKey,
} from "@workspace/api-client-react";
import { timeAgo } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";
import {
  ExternalLink, Clock, Calendar, Star, CheckCircle,
  Cpu, Zap, TrendingUp, Shield,
  Heart, Scale, Globe, Newspaper, MessageSquare, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight,
  Share2, Copy, Check, X as XIcon,
} from "lucide-react";
import { useState } from "react";
import { SubscribeModal } from "@/components/subscribe-modal";

const CATEGORY_CONFIG: Record<string, {
  label: string; gradient: string; badgeBg: string; badgeText: string; labelColor: string;
  icon: React.ElementType; unsplash: string;
}> = {
  "AI":         { label: "人工智能", gradient: "from-violet-600 to-indigo-700",  badgeBg: "rgba(139,92,246,0.25)",  badgeText: "#c4b5fd", labelColor: "#a78bfa", icon: Cpu,          unsplash: "photo-1677442135703-1787eea5ce01" },
  "Technology": { label: "科技",     gradient: "from-blue-600 to-cyan-700",      badgeBg: "rgba(59,130,246,0.25)",  badgeText: "#93c5fd", labelColor: "#60a5fa", icon: Zap,          unsplash: "photo-1518770660439-4636190af475" },
  "Business":   { label: "商业",     gradient: "from-emerald-600 to-teal-700",   badgeBg: "rgba(16,185,129,0.25)", badgeText: "#6ee7b7", labelColor: "#34d399", icon: TrendingUp,   unsplash: "photo-1507679799987-c73779587ccf" },
  "Security":   { label: "安全",     gradient: "from-red-600 to-rose-700",       badgeBg: "rgba(239,68,68,0.25)",  badgeText: "#fca5a5", labelColor: "#f87171", icon: Shield,       unsplash: "photo-1550751827-4bd374c3f58b" },
  "Health":     { label: "健康",     gradient: "from-pink-600 to-rose-700",      badgeBg: "rgba(236,72,153,0.25)", badgeText: "#f9a8d4", labelColor: "#f472b6", icon: Heart,        unsplash: "photo-1559757148-5c350d0d3c56" },
  "Policy":     { label: "政策",     gradient: "from-amber-500 to-yellow-600",   badgeBg: "rgba(245,158,11,0.25)", badgeText: "#fde68a", labelColor: "#fbbf24", icon: Scale,        unsplash: "photo-1529107386315-e1a2ed48a620" },
  "Space":      { label: "太空",     gradient: "from-sky-600 to-blue-700",       badgeBg: "rgba(14,165,233,0.25)", badgeText: "#7dd3fc", labelColor: "#38bdf8", icon: Globe,        unsplash: "photo-1446776877081-d282a0f896e2" },
};
const DEFAULT_CONFIG = { label: "资讯", gradient: "from-slate-600 to-slate-800", badgeBg: "rgba(100,116,139,0.25)", badgeText: "#cbd5e1", labelColor: "#94a3b8", icon: Newspaper, unsplash: "photo-1504711434969-e33886168f5c" };

function getUnsplashUrl(photoId: string, width = 900): string {
  return `https://images.unsplash.com/${photoId}?w=${width}&q=80&auto=format&fit=crop`;
}

export default function ArticleDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const id = Number(params.id);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const { data: article, isLoading: articleLoading } = useGetArticle(id, {
    query: { enabled: !!id, queryKey: getGetArticleQueryKey(id) },
  });

  const { data: comments, isLoading: commentsLoading } = useListComments(
    { article_id: id },
    { query: { enabled: !!id, queryKey: getListCommentsQueryKey({ article_id: id }) } }
  );

  const { data: adjacent } = useGetAdjacentArticles(id, {
    query: { enabled: !!id, queryKey: getGetAdjacentArticlesQueryKey(id) },
  });

  if (articleLoading) {
    return (
      <div className="max-w-6xl mx-auto py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 overflow-hidden bg-card border border-border" style={{ borderRadius: "1.5rem" }}>
            <Skeleton className="w-full h-64 rounded-none bg-muted/50" />
            <div className="p-8 space-y-4">
              <Skeleton className="w-full h-8 bg-muted/50" />
              <Skeleton className="w-3/4 h-8 bg-muted/50" />
              <Skeleton className="w-full h-32 bg-muted/50" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-5 space-y-3 bg-card border border-border" style={{ borderRadius: "1.5rem" }}>
                <Skeleton className="w-9 h-9 rounded-full bg-muted/50" />
                <Skeleton className="w-full h-16 bg-muted/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-foreground font-semibold text-lg">文章不存在或已被删除。</p>
      </div>
    );
  }

  const config = CATEGORY_CONFIG[article.category ?? ""] ?? DEFAULT_CONFIG;
  const bannerImageUrl = article.image_url || getUnsplashUrl(config.unsplash, 1200);
  const sourceDomain = article.source_url
    ? (() => { try { return new URL(article.source_url).hostname.replace("www.", ""); } catch { return null; } })()
    : null;

  const contentParagraphs = (article.content ?? "").split("\n\n").filter(p => p.trim());

  const pageTitle = `${article.title} | 智讯 Hub`;
  const pageDesc = article.summary
    ? article.summary.slice(0, 160)
    : `智讯 Hub — ${article.title}`;
  const pageUrl = `https://zhixunhub.com/article/${article.id}`;
  const pageImage = article.image_url ?? `https://zhixunhub.com/opengraph.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": pageDesc,
    "image": pageImage,
    "url": pageUrl,
    "datePublished": article.created_at,
    "publisher": {
      "@type": "Organization",
      "name": "智讯 Hub",
      "url": "https://zhixunhub.com",
    },
    ...(article.category ? { "articleSection": article.category } : {}),
  };

  return (
    <>
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <link rel="canonical" href={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content="article" />
      <meta property="og:image" content={pageImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={pageImage} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
    <div className="max-w-6xl mx-auto py-4" data-testid={`article-detail-${article.id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Main Article */}
        <article className="lg:col-span-2 overflow-hidden shadow-xl bg-card border border-border" style={{ borderRadius: "1.5rem" }}>

          {/* Hero Banner */}
          <div className="relative h-64 overflow-hidden" style={{ borderRadius: "1.5rem 1.5rem 0 0" }}>
            <img
              src={bannerImageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) parent.classList.add("bg-gradient-to-br", ...config.gradient.split(" "));
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              {article.category && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm rounded-full px-2.5 py-1 mb-3"
                  style={{ background: config.badgeBg, color: config.badgeText, border: `1px solid ${config.badgeText}33` }}>
                  <config.icon className="w-2.5 h-2.5" />
                  {config.label}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {article.title}
              </h1>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 px-8 py-4 text-xs text-muted-foreground font-medium border-b border-border">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0066FF]" />
              {article.reading_time} 分钟阅读
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">热度</span>
              <div className="w-16 h-1.5 rounded-full overflow-hidden bg-border">
                <div className="h-full rounded-full bg-[#0066FF]" style={{ width: `${article.hot_score}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground/60">{article.hot_score}</span>
            </span>
            {sourceDomain && article.source_url && (
              <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-[#0066FF] hover:opacity-80 transition-opacity">
                {sourceDomain} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-6">
            {article.summary && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0066FF] mb-3">内容摘要</p>
                <p className="text-foreground/90 leading-relaxed text-[15px]" style={{ lineHeight: 1.85 }}>
                  {article.summary}
                </p>
              </div>
            )}

            {contentParagraphs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0066FF] mb-3">深度拆解</p>
                <div className="text-foreground/80 text-sm space-y-4" style={{ lineHeight: 1.85 }}>
                  {contentParagraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            {article.source_url && (
              <div className="pt-4 border-t border-border">
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "rgba(0,102,255,0.1)", color: "#0066FF", border: "1px solid rgba(0,102,255,0.25)" }}
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  阅读英文原著
                </a>
                <p className="mt-2 text-[10px] text-muted-foreground/60">内容版权归原作者所有，本站仅提供 AI 摘要与解读</p>
              </div>
            )}

            {/* Share Bar */}
            {(() => {
              const articleUrl = `https://zhixunhub.com/article/${id}`;
              const ogUrl = `https://zhixunhub.com/api/og/${id}`;
              const encodedUrl = encodeURIComponent(articleUrl);
              const encodedTitle = encodeURIComponent(article.title);
              const handleCopy = () => {
                navigator.clipboard.writeText(articleUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              };
              const btnBase = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95";
              return (
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Share2 className="w-3 h-3" /> 分享文章
                  </p>
                  {article.share_text && (
                    <div className="mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm"
                      style={{ background: "rgba(0,102,255,0.06)", border: "1px solid rgba(0,102,255,0.15)" }}>
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#0066FF]" />
                      <span className="text-foreground/80 leading-relaxed text-[13px]">{article.share_text}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(article.share_text!).then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          });
                        }}
                        className="ml-auto shrink-0 text-[10px] font-semibold text-[#0066FF] hover:opacity-70 transition-opacity whitespace-nowrap"
                      >
                        {copied ? "已复制" : "复制"}
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {/* X / Twitter */}
                    <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer"
                      className={btnBase} style={{ background: "#000", color: "#fff" }}>
                      <XIcon className="w-3 h-3" /> X
                    </a>
                    {/* Facebook — uses /api/og/:id to bypass CDN bot protection */}
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogUrl)}`} target="_blank" rel="noopener noreferrer"
                      className={btnBase} style={{ background: "#1877F2", color: "#fff" }}>
                      <Globe className="w-3 h-3" /> Facebook
                    </a>
                    {/* 微信 QR */}
                    <button onClick={() => setShowQr(true)}
                      className={btnBase} style={{ background: "#07C160", color: "#fff" }}>
                      微信
                    </button>
                    {/* 复制链接 */}
                    <button onClick={handleCopy}
                      className={btnBase} style={{ background: copied ? "rgba(16,185,129,0.15)" : "rgba(0,0,0,0.06)", color: copied ? "#059669" : "var(--foreground)", border: "1px solid rgba(0,0,0,0.1)" }}>
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "已复制" : "复制链接"}
                    </button>
                  </div>

                  {/* 微信 QR 弹窗 */}
                  {showQr && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQr(false)}>
                      <div className="bg-card rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 max-w-xs w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between w-full">
                          <p className="font-bold text-sm">微信扫码分享</p>
                          <button onClick={() => setShowQr(false)} className="text-muted-foreground hover:text-foreground">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}&bgcolor=ffffff&color=000000&margin=8`}
                          alt="QR Code"
                          className="w-48 h-48 rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground text-center">用微信扫一扫，即可分享到朋友圈</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Prev / Next Navigation */}
            {adjacent && (adjacent.prev || adjacent.next) && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                {adjacent.prev ? (
                  <button
                    onClick={() => navigate(`/article/${adjacent.prev!.id}`)}
                    className="group flex flex-col gap-1.5 p-4 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: "rgba(0,102,255,0.05)", border: "1px solid rgba(0,102,255,0.12)" }}
                  >
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <ChevronLeft className="w-3 h-3" /> 上一篇
                    </span>
                    <span className="text-xs font-medium text-foreground leading-snug line-clamp-2 group-hover:text-[#0066FF] transition-colors">
                      {adjacent.prev.title}
                    </span>
                  </button>
                ) : <div />}

                {adjacent.next ? (
                  <button
                    onClick={() => navigate(`/article/${adjacent.next!.id}`)}
                    className="group flex flex-col gap-1.5 p-4 rounded-xl text-right transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: "rgba(0,102,255,0.05)", border: "1px solid rgba(0,102,255,0.12)" }}
                  >
                    <span className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      下一篇 <ChevronRight className="w-3 h-3" />
                    </span>
                    <span className="text-xs font-medium text-foreground leading-snug line-clamp-2 group-hover:text-[#0066FF] transition-colors">
                      {adjacent.next.title}
                    </span>
                  </button>
                ) : <div />}
              </div>
            )}

            {/* Subscribe Block */}
            <div
              className="mt-2 rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(0,102,255,0.07) 0%, rgba(0,68,204,0.03) 100%)",
                border: "1px solid rgba(0,102,255,0.15)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,102,255,0.6), transparent)" }} />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#0066FF]" fill="#0066FF" />
                    <span className="text-[10px] font-bold tracking-widest text-[#0066FF] uppercase">智讯内参</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">喜欢这篇深度拆解？</p>
                  <p className="text-xs text-muted-foreground">每 6 小时，更多这样的内参准时送达。拒绝被算法喂养。</p>
                </div>
                <button
                  onClick={() => setSubscribeOpen(true)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                  style={{
                    background: "linear-gradient(135deg, #0066FF, #0044CC)",
                    boxShadow: "0 0 16px rgba(0,102,255,0.35)",
                  }}
                >
                  加入智讯内参
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </article>
        <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />

        {/* 智讯锐评侧栏 */}
        <aside className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-[#0066FF]" fill="#0066FF" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">智讯锐评</h2>
          </div>

          {commentsLoading ? (
            Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="p-5 space-y-3 bg-card border border-border" style={{ borderRadius: "1.5rem" }}>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-full bg-muted/50" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="w-28 h-3.5 bg-muted/50" />
                    <Skeleton className="w-20 h-2.5 bg-muted/50" />
                  </div>
                </div>
                <Skeleton className="w-full h-32 bg-muted/50" />
              </div>
            ))
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment.id}
                data-testid={`comment-${comment.id}`}
                className="p-5 bg-card border border-border"
                style={{ borderRadius: "1.5rem" }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#0066FF] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">智讯 Hub 首席分析师</span>
                      <CheckCircle className="w-3.5 h-3.5 text-[#0066FF] flex-shrink-0" fill="#0066FF" />
                    </div>
                    <p className="text-[10px] font-bold text-[#0066FF] uppercase tracking-wider mt-0.5">行业洞察 · ZenStream AI</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 font-mono flex-shrink-0">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed" style={{ lineHeight: 1.8 }}>
                  {comment.content}
                </p>
              </div>
            ))
          ) : (
            <div className="p-6 text-center border border-dashed border-border" style={{ borderRadius: "1.5rem" }}>
              <MessageSquare className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">锐评生成中，请稍候。</p>
            </div>
          )}
        </aside>
      </div>
    </div>
    </>
  );
}
