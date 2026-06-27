import { Link, useLocation } from "wouter";
import { useGetStatsSummary, useTriggerFetch, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, RefreshCw, Moon, Sun, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SubscribeModal } from "@/components/subscribe-modal";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: stats } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() },
  });

  const queryClient = useQueryClient();
  const triggerFetch = useTriggerFetch({
    mutation: { onSuccess: () => queryClient.invalidateQueries() },
  });

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  const navLinks = [
    { href: "/", label: "头条" },
    { href: "/categories", label: "分类" },
    { href: "/about", label: "关于" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" style={{ fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
      <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
      {/* Top Stats Bar */}
      <div className="bg-[#0066FF] text-white text-xs py-2 px-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center gap-5 font-medium">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-3 h-3" />
            {stats?.total_articles ?? 0} 篇文章
          </span>
          <span className="hidden sm:inline text-white/70">|</span>
          <span className="hidden sm:inline">今日更新 {stats?.articles_today ?? 0} 篇</span>
          {stats?.top_category && (
            <>
              <span className="hidden md:inline text-white/70">|</span>
              <span className="hidden md:inline">热门：{stats.top_category}</span>
            </>
          )}
        </div>
        <button
          data-testid="button-refresh"
          onClick={() => triggerFetch.mutate()}
          disabled={triggerFetch.isPending}
          className="flex items-center gap-1.5 font-medium hover:text-white/80 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${triggerFetch.isPending ? "animate-spin" : ""}`} />
          {triggerFetch.isPending ? "获取中..." : "立即更新"}
        </button>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#0066FF] flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-lg tracking-tight">智讯 Hub</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = link.href === "/"
                ? location === "/"
                : location.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    active
                      ? "bg-[#0066FF]/15 text-[#0066FF]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="w-px h-5 bg-border mx-1" />

            <button
              onClick={() => setSubscribeOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0066FF, #0044CC)",
                boxShadow: "0 0 12px rgba(0,102,255,0.4)",
              }}
            >
              <Zap className="w-3 h-3" fill="white" />
              订阅内参
            </button>

            <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-border bg-background py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-[#0066FF] flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-white" fill="white" />
              </div>
              智讯 Hub
            </span>
            <div className="flex items-center gap-4">
              <Link href="/legal" className="hover:text-foreground transition-colors">版权声明</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">关于</Link>
              <span>© 2026 智讯 Hub</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed border-t border-border pt-4">
            本站内容由 AI 自动聚合并生成中文摘要与行业解读，旨在为中文读者提供信息检索便利。所有原始文章的著作权归原作者及原始出版方所有，本站不主张任何内容所有权。若您是原始内容的版权持有人，认为本站内容侵犯了您的合法权益，请发送电子邮件至{" "}
            <a href="mailto:zhixunhub@gmail.com" className="text-muted-foreground hover:text-foreground underline underline-offset-2">
              zhixunhub@gmail.com
            </a>
            ，我们将在收到通知后 48 小时内予以删除处理。详见{" "}
            <Link href="/legal" className="text-muted-foreground hover:text-foreground underline underline-offset-2">版权声明与合规说明</Link>。
          </p>
        </div>
      </footer>
    </div>
  );
}
