import {
  useGetStatsSummary, getGetStatsSummaryQueryKey,
  useListCategories, getListCategoriesQueryKey,
  useListTopArticles, getListTopArticlesQueryKey,
  useGetDailyViews, getGetDailyViewsQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

function StatCard({
  label,
  value,
  sub,
  icon,
  color = "blue",
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  color?: "blue" | "green" | "purple" | "orange";
}) {
  const colorMap = {
    blue:   { bg: "bg-blue-50 dark:bg-blue-950/30",   text: "text-blue-600 dark:text-blue-400",   border: "border-blue-100 dark:border-blue-900" },
    green:  { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-600 dark:text-green-400", border: "border-green-100 dark:border-green-900" },
    purple: { bg: "bg-purple-50 dark:bg-purple-950/30",text: "text-purple-600 dark:text-purple-400",border: "border-purple-100 dark:border-purple-900"},
    orange: { bg: "bg-orange-50 dark:bg-orange-950/30",text: "text-orange-600 dark:text-orange-400",border: "border-orange-100 dark:border-orange-900"},
  };
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border p-5 ${c.bg} ${c.border}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${c.text}`}>{value}</div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "bg-blue-500",
  AI: "bg-violet-500",
  Business: "bg-emerald-500",
  Health: "bg-pink-500",
  Security: "bg-red-500",
  Policy: "bg-amber-500",
  Space: "bg-sky-500",
  Finance: "bg-orange-500",
  Startups: "bg-pink-500",
  Science: "bg-cyan-500",
  Social: "bg-teal-500",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-blue-500">{payload[0]?.value ?? 0} 次阅读</p>
    </div>
  );
}

export default function Admin() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const QUERY_OPTS = { staleTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: true };

  const { data: summary, isLoading: loadingSummary, dataUpdatedAt } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey(), ...QUERY_OPTS },
  });
  const { data: categories, isLoading: loadingCats } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey(), ...QUERY_OPTS },
  });
  const { data: topArticles, isLoading: loadingTop } = useListTopArticles({
    query: { queryKey: getListTopArticlesQueryKey(), ...QUERY_OPTS },
  });
  const { data: dailyViews, isLoading: loadingDaily } = useGetDailyViews(
    { days: 14 },
    { query: { queryKey: getGetDailyViewsQueryKey({ days: 14 }), ...QUERY_OPTS } },
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListTopArticlesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetDailyViewsQueryKey({ days: 14 }) }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const maxCat = categories?.[0]?.count ?? 1;

  const chartData = dailyViews?.map((d) => ({
    date: d.date.slice(5),
    views: d.views,
  })) ?? [];

  const totalReads = dailyViews?.reduce((s, d) => s + d.views, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h1 className="text-2xl font-bold">后台数据</h1>
            <p className="text-sm text-muted-foreground">智讯 Hub 运营数据概览</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {/* Key Metrics */}
      <section className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          核心指标
        </h2>
        {loadingSummary ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="订阅人数"
              value={summary?.total_subscribers ?? 0}
              sub={`今日新增 +${summary?.subscribers_today ?? 0}`}
              icon="📧"
              color="green"
            />
            <StatCard
              label="文章总数"
              value={summary?.total_articles ?? 0}
              sub={`今日发布 ${summary?.articles_today ?? 0} 篇`}
              icon="📰"
              color="blue"
            />
            <StatCard
              label="14天总阅读"
              value={loadingDaily ? "—" : totalReads}
              sub="点击文章详情计入"
              icon="👁️"
              color="purple"
            />
            <StatCard
              label="热门分类"
              value={summary?.top_category ?? "—"}
              sub="文章最多的分类"
              icon="🏆"
              color="orange"
            />
          </div>
        )}
      </section>

      {/* Daily Views Chart */}
      <section className="mb-6 rounded-xl border bg-card p-5">
        <h2 className="mb-1 font-semibold">每日阅读趋势（近 14 天）</h2>
        <p className="mb-4 text-xs text-muted-foreground">从今天起往前 14 天，每天点击文章详情的次数（实时记录）</p>
        {loadingDaily ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        ) : chartData.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
            <span className="mb-2 text-3xl">📈</span>
            <p className="text-sm">暂无阅读数据</p>
            <p className="text-xs opacity-70">从现在起，每次有人打开文章详情页会被记录在这里</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="fill-muted-foreground" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">分类分布</h2>
          {loadingCats ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-7 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {categories?.map((cat) => (
                <div key={cat.category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-muted-foreground">{cat.count} 篇</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full transition-all ${CATEGORY_COLORS[cat.category] ?? "bg-gray-500"}`}
                      style={{ width: `${Math.round((cat.count / maxCat) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Articles by Views */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">最多阅读文章</h2>
          <p className="mb-3 text-xs text-muted-foreground">点击文章详情页才会计入阅读量</p>
          {loadingTop ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (topArticles?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <span className="mb-2 text-3xl">👀</span>
              <p className="text-sm">暂无阅读记录</p>
              <p className="text-xs opacity-70">读者开始阅读文章后会出现在这里</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {topArticles?.map((art, i) => (
                <li key={art.id} className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-muted-foreground/40"}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/article/${art.id}`} className="line-clamp-2 text-sm font-medium hover:text-blue-500">
                      {art.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {art.views} 次阅读 {art.category && `· ${art.category}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        每 30 秒自动刷新 · 阅读量从点击文章详情页开始计算
        {dataUpdatedAt ? ` · 最后更新 ${new Date(dataUpdatedAt).toLocaleTimeString("zh-CN")}` : ""}
      </p>
    </div>
  );
}
