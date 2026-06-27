import { Zap, Globe, Brain, Shield, Mail } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8">

      {/* Header */}
      <header className="mb-4 text-center px-4">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4"
          style={{ fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
          关于智讯 Hub
        </h1>
        <div className="w-16 h-1 bg-[#0066FF] mx-auto rounded-full" />
      </header>

      {/* Mission */}
      <section className="p-8 md:p-10 space-y-5 text-slate-400"
        style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", lineHeight: 1.75 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-[#0066FF] flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">我们的初衷</h2>
        </div>

        <p>
          <strong className="text-white">智讯 Hub</strong> 诞生于一个简单的信念：语言不应该成为获取前沿科技资讯的门槛。
        </p>
        <p>
          全球最重要的科技报道，绝大多数以英文发布。对于庞大的中文科技社区而言，这意味着每天都有海量高价值内容因语言壁垒而流失。我们希望用 AI 技术填补这道鸿沟——不是简单地"翻译"，而是为中文读者提供经过深度提炼的<strong className="text-slate-200">行业洞察</strong>，让你用最短的时间把握全球科技脉搏。
        </p>
        <p>
          平台 7×24 小时自动抓取 <strong className="text-slate-200">TechCrunch、The Verge、CNBC Tech</strong> 等一线媒体的最新报道，由 AI 首席分析师（Gemini 驱动）生成中文深度拆解与行业锐评，每天更新 4 次，无需人工干预。
        </p>

        {/* Feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { icon: Globe, label: "多源聚合", desc: "TechCrunch · The Verge · CNBC" },
            { icon: Brain, label: "AI 深度解读", desc: "Gemini 驱动，中文行业拆解" },
            { icon: Shield, label: "每天 4 次更新", desc: "全自动，无人工干预" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="px-4 py-3 rounded-xl text-center"
              style={{ background: "rgba(0,102,255,0.07)", border: "1px solid rgba(0,102,255,0.18)" }}>
              <Icon className="w-4 h-4 text-[#60a5fa] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-200">{label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="px-6 py-5"
        style={{ background: "rgba(0,102,255,0.07)", borderLeft: "4px solid #0066FF", borderRadius: "0 1rem 1rem 0" }}>
        <h3 className="font-bold text-sm text-[#60a5fa] uppercase tracking-wider mb-2">技术架构</h3>
        <p className="text-slate-300 text-sm" style={{ lineHeight: 1.7 }}>
          前端：React + Vite + Tailwind CSS + TanStack Query；后端：Express 5 + PostgreSQL + Drizzle ORM；AI 层：Google Gemini Flash API；抓取层：Firecrawl API。
        </p>
      </section>

      {/* Copyright declaration */}
      <section className="p-8 md:p-10 space-y-5 text-slate-400"
        style={{ background: "#0f1623", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", lineHeight: 1.75 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">版权声明与合规说明</h2>
        </div>

        <p>
          智讯 Hub 是一个 <strong className="text-slate-200">AI 内容聚合与解读平台</strong>，而非原始内容的发布方。本站的核心价值在于为中文读者提供基于原文的结构化摘要与行业分析，旨在辅助信息检索，并为原始媒体导流。
        </p>

        <ul className="space-y-3 text-sm list-none">
          {[
            "本站展示的所有摘要、深度拆解及行业锐评，均由 AI 对原始英文报道进行二次创作生成，不构成对原文的逐字复制。",
            "每篇文章均标注原始来源（媒体名称及可点击链接），读者可随时跳转至原站阅读完整报道。",
            "本站不主张对任何原始文章内容的著作权。所有版权归原作者及其所属出版机构所有。",
            "本站运营遵循合理使用（Fair Use）原则，内容用途为评论、报道与信息检索，不以任何形式出售或替代原始内容。",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0066FF] flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Takedown box */}
        <div className="mt-2 px-5 py-4 rounded-xl"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span className="text-sm font-bold text-red-400">侵权删稿通道</span>
          </div>
          <p className="text-sm text-slate-400" style={{ lineHeight: 1.7 }}>
            若您是原始内容的版权持有人，认为本站内容侵犯了您的合法权益，请发送电子邮件至{" "}
            <a href="mailto:zhixunhub@gmail.com"
              className="text-red-300 hover:text-red-200 underline underline-offset-2 font-medium">
              zhixunhub@gmail.com
            </a>
            。来信请注明：原始文章链接、权利归属证明及具体侵权内容说明。我们承诺在收到有效通知后 <strong className="text-slate-200">48 小时内</strong>完成审核与删除处理。
          </p>
        </div>
      </section>

    </div>
  );
}
