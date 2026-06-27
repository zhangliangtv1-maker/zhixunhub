import { Link } from "wouter";
import { useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Cpu, Zap, TrendingUp, Shield, Heart, Scale, Globe, Newspaper } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; gradient: string; icon: React.ElementType }> = {
  "AI":         { label: "人工智能", gradient: "from-violet-600 to-indigo-700", icon: Cpu },
  "Technology": { label: "科技",     gradient: "from-blue-600 to-cyan-700",     icon: Zap },
  "Business":   { label: "商业",     gradient: "from-emerald-600 to-teal-700",  icon: TrendingUp },
  "Security":   { label: "安全",     gradient: "from-red-600 to-rose-700",      icon: Shield },
  "Health":     { label: "健康",     gradient: "from-pink-600 to-rose-700",     icon: Heart },
  "Policy":     { label: "政策",     gradient: "from-amber-500 to-yellow-600",  icon: Scale },
  "Space":      { label: "太空",     gradient: "from-sky-600 to-blue-700",      icon: Globe },
};
const DEFAULT_CONFIG = { label: "资讯", gradient: "from-slate-600 to-slate-800", icon: Newspaper };

export default function Categories() {
  const { data: categories, isLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
          按分类浏览
        </h1>
        <p className="text-muted-foreground text-sm">探索按主题整理的全球科技资讯。</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden bg-card border border-border" style={{ borderRadius: "1.5rem" }}>
              <Skeleton className="w-full h-24 bg-muted/50 rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="w-24 h-4 bg-muted/50" />
                <Skeleton className="w-12 h-3 bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat.category] ?? DEFAULT_CONFIG;
            const Icon = config.icon;
            return (
              <Link key={cat.category} href={`/?category=${encodeURIComponent(cat.category)}`}>
                <div
                  data-testid={`category-card-${cat.category}`}
                  className="group overflow-hidden cursor-pointer bg-card border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <div className={`bg-gradient-to-br ${config.gradient} h-20 flex items-center justify-center relative overflow-hidden`}>
                    <span className="absolute text-white/10 font-black" style={{ fontSize: "3.5rem", letterSpacing: "-0.02em" }}>
                      {config.label[0]}
                    </span>
                    <Icon className="w-8 h-8 text-white/60 relative z-10" strokeWidth={1.5} />
                  </div>
                  <div className="p-4">
                    <h2 className="text-sm font-bold text-foreground mb-1 group-hover:text-[#0066FF] transition-colors"
                      style={{ fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
                      {config.label}
                    </h2>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{cat.count} 篇</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-[#0066FF] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 border border-dashed border-border rounded-3xl">
          <p className="text-muted-foreground text-sm">暂无分类数据。</p>
        </div>
      )}
    </div>
  );
}
