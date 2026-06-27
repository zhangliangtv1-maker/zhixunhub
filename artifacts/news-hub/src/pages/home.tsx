import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  useListArticles, useListCategories,
  getListArticlesQueryKey, getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Zap, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SubscribeModal } from "@/components/subscribe-modal";

const CATEGORY_LABELS: Record<string, string> = {
  "AI": "人工智能",
  "Technology": "科技",
  "Business": "商业",
  "Security": "安全",
  "Health": "健康",
  "Policy": "政策",
  "Space": "太空",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [category, setCategory] = useState<string | undefined>(searchParams.get("category") || undefined);
  const [limit, setLimit] = useState(20);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setLimit(20); }, [debouncedSearch, category]);

  const { data: categoriesData, isLoading: categoriesLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const queryParams = { search: debouncedSearch || undefined, category, limit, offset: 0 };

  const {
    data: articlesData,
    isLoading: articlesLoading,
    isError: articlesError,
    isFetching,
    refetch,
  } = useListArticles(queryParams, {
    query: {
      queryKey: getListArticlesQueryKey(queryParams),
      retry: 2,
    },
  });

  const articles = articlesData?.articles ?? [];

  return (
    <div className="space-y-6">
      <Helmet>
        <link rel="canonical" href="https://zhixunhub.com/" />
        <meta property="og:url" content="https://zhixunhub.com/" />
      </Helmet>
      <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />

      {/* Hero Subscribe Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, rgba(0,102,255,0.08) 0%, rgba(0,68,204,0.04) 100%)",
          border: "1px solid rgba(0,102,255,0.15)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(0,102,255,0.06), transparent)" }} />
        <div className="relative space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#0066FF] flex items-center justify-center" style={{ boxShadow: "0 0 10px rgba(0,102,255,0.6)" }}>
              <Zap className="w-3 h-3 text-white" fill="white" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-[#0066FF] uppercase">智讯内参</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">获取过滤后的资讯</h2>
          <p className="text-sm text-muted-foreground max-w-md">及時過濾全球核心源，只留最值得關注的真相。專業讀者持續加入，口碑傳播中。</p>
        </div>
        <button
          onClick={() => setSubscribeOpen(true)}
          className="relative flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
          style={{
            background: "linear-gradient(135deg, #0066FF, #0044CC)",
            boxShadow: "0 0 20px rgba(0,102,255,0.4), 0 4px 12px rgba(0,102,255,0.2)",
          }}
        >
          免費獲取每日推送
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter + Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            data-testid="filter-all"
            onClick={() => setCategory(undefined)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
              !category
                ? "bg-[#0066FF] text-white border-[#0066FF]"
                : "bg-muted/50 text-muted-foreground border-border hover:border-[#0066FF]/60 hover:text-foreground"
            }`}
          >
            全部
          </button>
          {categoriesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-7 rounded-full bg-muted" />
              ))
            : categoriesData?.map((cat) => (
                <button
                  key={cat.category}
                  data-testid={`filter-${cat.category}`}
                  onClick={() => setCategory(cat.category)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                    category === cat.category
                      ? "bg-[#0066FF] text-white border-[#0066FF]"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-[#0066FF]/60 hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat.category] ?? cat.category}
                  <span className="ml-1.5 text-[10px] opacity-50">{cat.count}</span>
                </button>
              ))}
        </div>

        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder="探索全球科技趋势..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#0066FF]/30 focus-visible:border-[#0066FF]/50"
          />
        </div>
      </div>

      {/* Bento Grid */}
      {articlesLoading && !articlesData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`overflow-hidden bg-card border border-border ${i === 0 ? "md:col-span-2" : ""}`}
              style={{ borderRadius: "1.5rem" }}
            >
              <Skeleton className={`w-full ${i === 0 ? "h-60" : "h-44"} rounded-none bg-muted/50`} />
              <div className="p-5 space-y-3">
                <Skeleton className="w-16 h-3 rounded-full bg-muted/50" />
                <Skeleton className="w-full h-5 bg-muted/50" />
                <Skeleton className="w-3/4 h-5 bg-muted/50" />
                <Skeleton className="w-full h-4 bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      ) : articlesError ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed border-border rounded-3xl">
          <p className="text-foreground font-semibold text-lg">加载失败</p>
          <p className="text-muted-foreground text-sm">无法获取文章数据，请稍后重试。</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
              refetch();
            }}
            className="rounded-xl border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-[#0066FF]/60"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            重新加载
          </Button>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-3xl">
          <p className="text-foreground font-semibold text-lg mb-1">暂无相关文章</p>
          <p className="text-muted-foreground text-sm">请尝试调整搜索关键词或分类筛选。</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <div key={article.id} className={i === 0 ? "md:col-span-2" : ""}>
                <ArticleCard article={article} featured={i === 0} />
              </div>
            ))}
          </div>

          {articlesData && articles.length < articlesData.total && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLimit((p) => p + 20)}
                disabled={isFetching}
                className="min-w-48 rounded-xl border-border bg-muted/50 text-muted-foreground hover:border-[#0066FF]/60 hover:text-foreground"
              >
                {isFetching ? "加载中..." : `加载更多（剩余 ${articlesData.total - articles.length} 篇）`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
