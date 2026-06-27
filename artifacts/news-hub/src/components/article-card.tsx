import { Link } from "wouter";
import { Article } from "@workspace/api-client-react";
import { timeAgo } from "@/lib/date-utils";
import {
  Cpu, Zap, TrendingUp, Shield,
  Heart, Scale, Globe, Newspaper, Clock, MessageSquare,
} from "lucide-react";

const CATEGORY_CONFIG: Record<string, {
  label: string;
  gradient: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ElementType;
  unsplash: string;
}> = {
  "AI":         { label: "人工智能", gradient: "from-violet-600 to-indigo-700",  badgeBg: "bg-violet-500/20", badgeText: "text-violet-300",  icon: Cpu,          unsplash: "photo-1677442135703-1787eea5ce01" },
  "Technology": { label: "科技",     gradient: "from-blue-600 to-cyan-700",      badgeBg: "bg-blue-500/20",   badgeText: "text-blue-300",    icon: Zap,          unsplash: "photo-1518770660439-4636190af475" },
  "Business":   { label: "商业",     gradient: "from-emerald-600 to-teal-700",   badgeBg: "bg-emerald-500/20",badgeText: "text-emerald-300", icon: TrendingUp,   unsplash: "photo-1507679799987-c73779587ccf" },
  "Security":   { label: "安全",     gradient: "from-red-600 to-rose-700",       badgeBg: "bg-red-500/20",    badgeText: "text-red-300",     icon: Shield,       unsplash: "photo-1550751827-4bd374c3f58b" },
  "Health":     { label: "健康",     gradient: "from-pink-600 to-rose-700",      badgeBg: "bg-pink-500/20",   badgeText: "text-pink-300",    icon: Heart,        unsplash: "photo-1559757148-5c350d0d3c56" },
  "Policy":     { label: "政策",     gradient: "from-amber-500 to-yellow-600",   badgeBg: "bg-amber-500/20",  badgeText: "text-amber-300",   icon: Scale,        unsplash: "photo-1529107386315-e1a2ed48a620" },
  "Space":      { label: "太空",     gradient: "from-sky-600 to-blue-700",       badgeBg: "bg-sky-500/20",    badgeText: "text-sky-300",     icon: Globe,        unsplash: "photo-1446776877081-d282a0f896e2" },
};
const DEFAULT_CONFIG = {
  label: "资讯",
  gradient: "from-slate-600 to-slate-800",
  badgeBg: "bg-muted/50",
  badgeText: "text-muted-foreground",
  icon: Newspaper,
  unsplash: "photo-1504711434969-e33886168f5c",
};

function getUnsplashUrl(photoId: string, width = 600): string {
  return `https://images.unsplash.com/${photoId}?w=${width}&q=80&auto=format&fit=crop`;
}

function getSourceLabel(sourceUrl: string | null | undefined): string | null {
  if (!sourceUrl) return null;
  try {
    const host = new URL(sourceUrl).hostname.replace("www.", "");
    if (host.includes("techcrunch")) return "TechCrunch";
    if (host.includes("theverge"))  return "The Verge";
    if (host.includes("cnbc"))      return "CNBC";
    return host.split(".")[0];
  } catch {
    return null;
  }
}

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const config = CATEGORY_CONFIG[article.category ?? ""] ?? DEFAULT_CONFIG;
  const Icon = config.icon;
  const bannerHeight = featured ? "h-60" : "h-44";
  const imageUrl = article.image_url || getUnsplashUrl(config.unsplash, featured ? 1000 : 600);
  const sourceLabel = getSourceLabel(article.source_url);
  const aiComment = article.ai_comment;

  return (
    <Link href={`/article/${article.id}`} className="block h-full">
      <div
        data-testid={`card-article-${article.id}`}
        className="group flex flex-col h-full overflow-hidden cursor-pointer
          bg-card border border-border
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20"
        style={{ borderRadius: "1.5rem" }}
      >
        {/* Image Banner */}
        <div className={`relative ${bannerHeight} flex-shrink-0 overflow-hidden`} style={{ borderRadius: "1.5rem 1.5rem 0 0" }}>
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.className += ` bg-gradient-to-br ${config.gradient}`;
                const label = document.createElement("div");
                label.className = "absolute inset-0 flex items-center justify-center";
                label.innerHTML = `<span style="font-size:3rem;font-weight:800;color:rgba(255,255,255,0.12);letter-spacing:0.05em;font-family:Inter,'PingFang SC',sans-serif">${config.label}</span>`;
                parent.appendChild(label);
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {article.category && (
            <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 backdrop-blur-sm ${config.badgeBg} ${config.badgeText}`}
              style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
              <Icon className="w-2.5 h-2.5" />
              {config.label}
            </span>
          )}

          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-medium text-white/80 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
            <Clock className="w-2.5 h-2.5" />
            {article.reading_time} min
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          {sourceLabel && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              {sourceLabel}
            </span>
          )}

          <h2
            className={`leading-snug line-clamp-2 mb-2 text-foreground group-hover:text-[#0066FF] transition-colors ${featured ? "text-xl" : "text-base"}`}
            style={{ fontWeight: 700, lineHeight: 1.4 }}
          >
            {article.title}
          </h2>

          {article.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4" style={{ lineHeight: 1.6 }}>
              {article.summary}
            </p>
          )}

          <div className="flex-1" />

          {aiComment && (
            <div className="mt-3 px-3.5 py-3 bg-muted/50 border border-border" style={{ borderRadius: "0.875rem" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3 h-3 text-[#0066FF]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF]">智讯锐评</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2" style={{ lineHeight: 1.6 }}>
                {aiComment}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">热度</span>
              <span className="text-[10px] text-muted-foreground/70 font-mono">{timeAgo(article.created_at)}</span>
            </div>
            <div className="h-0.5 rounded-full overflow-hidden bg-border">
              <div
                className="h-full rounded-full bg-[#0066FF] transition-all duration-500"
                style={{ width: `${article.hot_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
