import { Link } from "wouter";

interface CalcHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  breadcrumb?: string;
}

export function CalcHeader({ title, description, icon, badge, breadcrumb }: CalcHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="text-xs text-blue-300/70 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-blue-200 transition-colors">Home</Link>
          <span className="text-blue-500">/</span>
          <span className="text-blue-200">{breadcrumb ?? title}</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 flex-shrink-0 mt-0.5">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
              {badge && (
                <span className="text-xs font-medium bg-blue-500/20 border border-blue-400/30 text-blue-200 px-2.5 py-1 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-blue-100/70 mt-1.5 text-sm md:text-base max-w-2xl leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
