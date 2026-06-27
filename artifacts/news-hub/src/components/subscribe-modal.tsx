import { useState } from "react";
import { X, Zap, Mail, ArrowRight, CheckCircle } from "lucide-react";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubscribeModal({ open, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { success?: boolean; message?: string };
      if (!res.ok) {
        setErrorMsg(data.message ?? "订阅失败，请稍后重试");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("网络错误，请稍后重试");
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal — always dark, independent of theme */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "#0d1424",
          border: "1px solid rgba(0,102,255,0.2)",
          boxShadow: "0 0 0 1px rgba(0,102,255,0.15), 0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(0,102,255,0.08)",
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,102,255,0.8), transparent)" }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {status === "success" ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(0,102,255,0.15)", border: "1px solid rgba(0,102,255,0.3)" }}>
                <CheckCircle className="w-7 h-7 text-[#0066FF]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">已加入智讯内参</h3>
                <p className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>每 6 小时，过滤后的真相准时送达</p>
              </div>
              <button
                onClick={onClose}
                className="text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              >
                关闭窗口
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-[#0066FF] flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 0 20px rgba(0,102,255,0.5)" }}>
                  <Zap className="w-5 h-5 text-white" fill="white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-[#0066FF] uppercase">智讯内参</div>
                  <h2 className="text-lg font-bold text-white leading-tight">拒绝被算法喂养</h2>
                </div>
              </div>

              <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                我们每 <span className="text-white font-semibold">6 小时</span> 过滤全球 200+ 核心源，只为你留下最冷峻的真相。告别信息噪音，获取真正值得关注的科技动态。
              </p>

              {/* Social proof */}
              <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg" style={{ background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.18)" }}>
                <div className="flex -space-x-1.5">
                  {["A", "B", "C"].map((l, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-[#0066FF] flex items-center justify-center text-[8px] text-white font-bold" style={{ border: "1px solid #0d1424" }}>
                      {l}
                    </div>
                  ))}
                </div>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>已有 <span className="text-white font-semibold">越来越多</span> 专业读者加入</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="输入您的 Email 地址"
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                    }}
                    onFocus={e => (e.currentTarget.style.border = "1px solid rgba(0,102,255,0.6)")}
                    onBlur={e => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)")}
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-red-400">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #0066FF, #0044CC)",
                    boxShadow: "0 0 20px rgba(0,102,255,0.35), 0 4px 12px rgba(0,102,255,0.2)",
                  }}
                >
                  {status === "loading" ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      免費訂閱
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.3)" }}>免费 · 随时可退订 · 不骚扰</p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
