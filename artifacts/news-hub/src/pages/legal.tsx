import { Shield, FileText, Mail, AlertTriangle, BookOpen, Scale, Eye, Rss } from "lucide-react";

const CONTACT_EMAIL = "zhixunhub@gmail.com";

const Section = ({
  icon: Icon,
  title,
  accent = false,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) => (
  <section
    className="p-8 md:p-10 space-y-4 text-slate-400"
    style={{
      background: accent ? "rgba(239,68,68,0.04)" : "#0f1623",
      border: `1px solid ${accent ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: "1.5rem",
      lineHeight: 1.8,
    }}
  >
    <div className="flex items-center gap-2.5 mb-1">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{
          background: accent ? "rgba(239,68,68,0.12)" : "rgba(0,102,255,0.12)",
          border: `1px solid ${accent ? "rgba(239,68,68,0.25)" : "rgba(0,102,255,0.25)"}`,
        }}
      >
        <Icon className={`w-3.5 h-3.5 ${accent ? "text-red-400" : "text-[#60a5fa]"}`} />
      </div>
      <h2 className="text-base font-bold text-white uppercase tracking-wider">{title}</h2>
    </div>
    {children}
  </section>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5 text-sm">
    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#0066FF] flex-shrink-0" />
    <span>{children}</span>
  </li>
);

export default function Legal() {
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8">

      <header className="mb-4 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(0,102,255,0.1)", border: "1px solid rgba(0,102,255,0.2)", color: "#60a5fa" }}>
          <Scale className="w-3 h-3" />
          法律文件 · Legal Document
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-3"
          style={{ fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', sans-serif" }}>
          版权声明与合规说明
        </h1>
        <p className="text-slate-400 text-sm">Copyright Notice & Compliance Statement</p>
        <p className="text-slate-500 text-xs mt-2">最后更新：2026 年 5 月 · Last updated: May 2026</p>
        <div className="w-16 h-1 bg-[#0066FF] mx-auto rounded-full mt-4" />
      </header>

      {/* 平台性质声明 */}
      <Section icon={FileText} title="一、平台性质声明">
        <p>
          <strong className="text-slate-200">智讯 Hub（zhixunhub.com）</strong> 是一个由人工智能驱动的科技新闻聚合与解读平台，面向中文读者提供基于互联网公开 RSS 订阅源的内容摘要与行业分析。
        </p>
        <p>
          本平台<strong className="text-slate-200">不是</strong>原始新闻内容的发布方，亦不声称对任何第三方新闻媒体原始报道享有内容著作权。本站的核心功能包括：
        </p>
        <ul className="space-y-2.5">
          <Bullet>通过媒体公开 RSS 订阅源自动获取文章标题、摘要及原文链接</Bullet>
          <Bullet>使用 Google Gemini AI 模型对原文进行中文摘要生成与行业视角解读</Bullet>
          <Bullet>为读者提供原始文章的清晰出处标注与可点击跳转链接，以便阅读原文</Bullet>
        </ul>
      </Section>

      {/* 内容获取方式 */}
      <Section icon={Rss} title="二、内容获取与技术说明">
        <p>本站通过以下方式获取内容，均为媒体公开提供的标准机读接口：</p>
        <ul className="space-y-2.5">
          <Bullet>
            <strong className="text-slate-300">RSS 订阅源</strong>：TechCrunch、The Verge、Wired、Ars Technica、VentureBeat、MIT Technology Review 等媒体均通过 RSS/Atom 格式主动向公众开放其文章摘要与链接，供订阅方使用。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">仅获取摘要</strong>：本站不抓取或存储原始文章正文全文，仅使用 RSS 源中包含的标题与简短摘要（excerpt）进行 AI 处理。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">导流而非替代</strong>：每篇内容卡片均附带原文链接，本站目的是帮助中文读者发现原始内容，而非取代原始媒体的阅读体验。
          </Bullet>
        </ul>
      </Section>

      {/* 合理使用原则 */}
      <Section icon={BookOpen} title="三、合理使用原则（Fair Use）">
        <p>
          本站的内容处理方式符合美国版权法第 107 条规定的<strong className="text-slate-200">合理使用（Fair Use）</strong>原则，及相关国际版权惯例。具体依据如下：
        </p>
        <ul className="space-y-2.5">
          <Bullet>
            <strong className="text-slate-300">使用目的与性质</strong>：为评论、报道、信息检索及教育目的，属于转化性使用（transformative use），非商业性娱乐或替代性消费。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">使用比例</strong>：本站 AI 生成内容基于原文摘要（RSS excerpt），未复制原始文章全文，使用比例极小。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">市场影响</strong>：本站通过导流链接为原始媒体带来额外流量，不构成对原始内容市场的实质性损害，效果相反。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">AI 二次创作</strong>：所有中文摘要与"智讯锐评"均为 AI 基于原文观点进行的再创作，具有独立表达性，不构成逐字复制。
          </Bullet>
        </ul>
      </Section>

      {/* 免责声明 */}
      <Section icon={AlertTriangle} title="四、免责声明">
        <ul className="space-y-2.5">
          <Bullet>
            <strong className="text-slate-300">信息准确性</strong>：本站 AI 生成的中文摘要与行业解读仅供参考，可能存在翻译偏差或理解误差，不构成任何投资、法律或商业建议。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">外部链接</strong>：本站对所链接的第三方网站的内容、隐私政策或安全性不承担任何责任。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">服务可用性</strong>：本站以"现状"（as-is）提供服务，不对服务连续性、准确性或完整性作出明示或默示保证。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">AI 生成内容</strong>：平台内所有"智讯锐评"由 Google Gemini 模型生成，代表 AI 的分析视角，不代表任何个人、机构或媒体的立场。
          </Bullet>
        </ul>
      </Section>

      {/* 隐私说明 */}
      <Section icon={Eye} title="五、隐私与数据说明">
        <ul className="space-y-2.5">
          <Bullet>
            <strong className="text-slate-300">订阅邮箱</strong>：若您提交邮箱订阅，您的邮箱地址将存储于本站数据库，仅用于发送智讯内参通讯，不会出售或共享给任何第三方。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">访问日志</strong>：本站服务器可能记录标准访问日志（IP 地址、访问时间、页面路径），用于运维与安全目的，保留时间不超过 30 天。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">Cookie</strong>：本站仅使用功能性 Cookie（如主题偏好存储），不使用任何追踪或广告 Cookie。
          </Bullet>
          <Bullet>
            <strong className="text-slate-300">退订</strong>：您可随时通过发送邮件至 <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">{CONTACT_EMAIL}</a> 申请删除您的订阅记录。
          </Bullet>
        </ul>
      </Section>

      {/* DMCA / 侵权删稿 */}
      <Section icon={Mail} title="六、侵权投诉与删稿通道" accent>
        <p className="text-sm">
          若您是原始内容的版权持有人，认为本站内容侵犯了您的合法权益，请按以下方式提交删稿申请。我们对所有有效投诉保持零容忍态度，并承诺快速响应。
        </p>

        <div className="space-y-3 text-sm">
          <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="font-bold text-red-300 mb-1">投诉邮件请发送至：</p>
            <a href={`mailto:${CONTACT_EMAIL}`}
              className="text-red-200 hover:text-white font-mono text-base underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            <p className="text-slate-500 text-xs mt-1">邮件主题请注明：[版权投诉] + 媒体名称</p>
          </div>

          <p className="font-semibold text-slate-300">来信请包含以下信息：</p>
          <ul className="space-y-2">
            <Bullet>原始文章的完整 URL 链接</Bullet>
            <Bullet>本站涉嫌侵权内容的页面 URL</Bullet>
            <Bullet>您作为版权持有人的身份证明或授权声明</Bullet>
            <Bullet>具体说明您认为侵权的内容范围</Bullet>
          </ul>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            我们承诺在收到有效通知后 <strong className="text-slate-300">48 小时内</strong>完成审核与删除处理
          </div>
        </div>
      </Section>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 pb-4">
        本声明受中华人民共和国相关法律法规及国际版权公约约束。如有法律争议，以中文文本为准。<br />
        This statement is governed by applicable PRC laws and international copyright conventions.
      </p>

    </div>
  );
}
