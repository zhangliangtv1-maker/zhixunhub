export function Dark() {
  const articles = [
    { cat: "科技", title: "苹果发布 M4 芯片：性能提升 40%，AI 推理能力大幅强化", summary: "苹果最新一代 M4 芯片在神经引擎方面实现了重大突破，本地 AI 处理速度较上代提升显著。", time: "2 小时前", source: "The Verge" },
    { cat: "人工智能", title: "OpenAI 发布 GPT-5：多模态理解再上台阶，逻辑推理接近人类水平", summary: "GPT-5 在多项标准基准测试中刷新纪录，复杂推理和代码生成能力尤为突出。", time: "4 小时前", source: "TechCrunch" },
    { cat: "安全", title: "Log4Shell 新变种肆虐：超 3 万台服务器遭入侵，修复补丁已发布", summary: "安全研究人员发现 Log4Shell 高危变种，攻击者可绕过现有防护机制，建议立即升级。", time: "6 小时前", source: "Wired" },
    { cat: "商业", title: "英伟达市值突破 4 万亿美元，成为全球首家达到该里程碑的公司", summary: "受 AI 算力需求持续爆发驱动，英伟达股价屡创新高，市值一路狂飙超越苹果和微软。", time: "8 小时前", source: "Ars Technica" },
  ];
  const cats = ["全部", "科技 29", "人工智能 29", "商业 9", "安全 9", "健康 8", "政策 4", "太空 2"];
  return (
    <div style={{ background: "#0a0f1a", minHeight: "100vh", fontFamily: "Inter, 'PingFang SC', sans-serif", color: "#e2e8f0" }}>
      {/* Nav */}
      <div style={{ background: "#0d1525", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>智讯 Hub</span>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#94a3b8" }}>
          <span style={{ color: "#fff", fontWeight: 600 }}>头条</span><span>分类</span><span>关于</span>
        </div>
      </div>
      {/* Stats bar */}
      <div style={{ background: "#4f46e5", padding: "8px 24px", fontSize: 12, color: "#c7d2fe", display: "flex", gap: 20 }}>
        <span>90 篇文章</span><span>|</span><span>今日更新 90 篇</span><span>|</span><span>热门：AI</span>
      </div>
      {/* Filters */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {cats.map((c, i) => (
          <span key={c} style={{ padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: "pointer", background: i === 0 ? "#4f46e5" : "rgba(255,255,255,0.06)", color: i === 0 ? "#fff" : "#94a3b8", border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.08)" }}>{c}</span>
        ))}
      </div>
      {/* Grid */}
      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {articles.map((a) => (
          <div key={a.title} style={{ background: "#111827", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ height: 140, background: "linear-gradient(135deg,#1e293b,#0f172a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📰</div>
            <div style={{ padding: 16 }}>
              <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{a.cat}</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.5, margin: "6px 0 8px" }}>{a.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>{a.summary}</div>
              <div style={{ background: "rgba(99,102,241,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#818cf8" }}>💬 智讯锐评：AI 产业格局正在被重新塑造，这一趋势值得持续关注。</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "#475569" }}>
                <span>{a.source}</span><span>{a.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
