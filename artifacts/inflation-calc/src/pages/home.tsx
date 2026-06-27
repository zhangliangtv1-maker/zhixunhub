import { useState, useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { Link, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout";

function QuickCalc() {
  const [initial, setInitial] = useState("10000");
  const [monthly, setMonthly] = useState("1000");
  const [rate, setRate] = useState("8");
  const [years, setYears] = useState("10");
  const [, setLocation] = useLocation();

  const sanitize = (v: string) => v.replace(/[^\d.]/g, "").replace(/^0+(\d)/, "$1");
  const n = (v: string, fallback = 0) => { const x = parseFloat(v); return isNaN(x) ? fallback : x; };
  const iVal = n(initial, 0);
  const mVal = n(monthly, 0);
  const rVal = n(rate, 0);
  const yVal = Math.max(1, Math.round(n(years, 1)));

  let value = iVal;
  for (let i = 0; i < yVal; i++) {
    value = value * (1 + rVal / 100) + mVal * 12;
  }
  const totalContrib = iVal + mVal * 12 * yVal;
  const gain = value - totalContrib;

  return (
    <Card className="shadow-xl border-0 bg-white w-full">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base text-slate-800">Quick Experience</CardTitle>
        <CardDescription className="text-xs">See how your money grows in 3 seconds</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500">Initial Amount ($)</Label>
            <Input
              type="text" inputMode="numeric" value={initial}
              onChange={e => setInitial(sanitize(e.target.value))}
              className="mt-1 h-9 text-sm" data-testid="quick-initial"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Monthly Savings ($)</Label>
            <Input
              type="text" inputMode="numeric" value={monthly}
              onChange={e => setMonthly(sanitize(e.target.value))}
              className="mt-1 h-9 text-sm" data-testid="quick-monthly"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Annual Return (%)</Label>
            <Input
              type="text" inputMode="decimal" value={rate}
              onChange={e => setRate(sanitize(e.target.value))}
              className="mt-1 h-9 text-sm" data-testid="quick-rate"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Years</Label>
            <Input
              type="text" inputMode="numeric" value={years}
              onChange={e => setYears(sanitize(e.target.value))}
              className="mt-1 h-9 text-sm" data-testid="quick-years"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5" data-testid="quick-result">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Final Value</span>
            <span className="font-bold text-blue-700 text-lg">${Math.round(value).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Total Contributions</span>
            <span className="text-sm font-medium text-slate-700">${Math.round(totalContrib).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Interest Earned</span>
            <span className="text-sm font-semibold text-blue-600">+${Math.round(gain).toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={() => setLocation("/compound")}
          data-testid="quick-full-calc"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          Full Inflation-Adjusted Calculator
        </button>
      </CardContent>
    </Card>
  );
}

const calculators = [
  {
    title: "Compound Interest",
    desc: "Inflation-adjusted compound growth with annual contributions",
    path: "/compound",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    ),
  },
  {
    title: "Purchasing Power",
    desc: "Compare the real value of money across 1960–2024 using CPI data",
    path: "/purchasing-power",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
  {
    title: "FIRE / Retirement",
    desc: "FI number, 4% rule safe withdrawal, and real retirement income",
    path: "/fire",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
  },
  {
    title: "College Savings",
    desc: "Project tuition with 5%/yr education inflation vs your savings plan",
    path: "/college",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    ),
  },
  {
    title: "Real Estate",
    desc: "Real (inflation-adjusted) property value, equity, and ROI over time",
    path: "/real-estate",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    ),
  },
  {
    title: "Real Rate of Return",
    desc: "Fisher equation: strip inflation from any nominal return instantly",
    path: "/real-return",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
];

const scenarios = [
  {
    icon: "📈",
    title: "The Power of Small Monthly Savings",
    highlight: "$500/month at 8% for 20 years → $294,510",
    detail: "You contributed $120,000. Compound interest earned you an extra $174,510 — almost 2.5× your money. But after 2.5% annual inflation, the real value is $180,000 in today's dollars.",
  },
  {
    icon: "🏠",
    title: "Home Value vs Real Purchasing Power",
    highlight: "A $400k home appreciating 3.5%/yr for 20 years → $795k nominal",
    detail: "That looks like a $395k gain — but after 2.5% annual inflation, the real (inflation-adjusted) value is $487k. Your real gain is $87k, not $395k. Knowing this prevents costly miscalculations.",
  },
  {
    icon: "🎓",
    title: "The Real Cost of College in 18 Years",
    highlight: "Today's $35k/year → $84k/year when your child starts college",
    detail: "College costs inflate ~5% per year historically. A 4-year degree that costs $140k today will cost $337k when a newborn turns 18. Start a 529 early — our calculator shows exactly how much you need to save.",
  },
];

export function Home() {
  useEffect(() => {
    setPageMeta({
      title: "InflationCalc — Free Inflation-Adjusted Financial Calculators",
      description: "6 free calculators that factor in inflation: compound interest, purchasing power (1960–2026 BLS data), FIRE retirement, college savings, real estate ROI, and real rate of return.",
      path: "/",
    });
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                6 Free Inflation Calculators
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight">
                See the <span className="text-blue-400">Real Value</span>{" "}
                of Your Money
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                A suite of precision financial calculators that factor in inflation — giving you the honest picture of your wealth, retirement, and investments over time.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/compound" data-testid="hero-start">
                  <button className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                    Start Compound Calculator
                  </button>
                </Link>
                <Link href="/fire" data-testid="hero-fire">
                  <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                    FIRE / Retirement
                  </button>
                </Link>
              </div>
            </div>
            <div className="w-full max-w-sm mx-auto md:mx-0 md:ml-auto">
              <QuickCalc />
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Professional Financial Tools</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Every calculator accounts for inflation — because nominal numbers lie.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {calculators.map(c => (
            <Link key={c.path} href={c.path} className="block" data-testid={`card-calc-${c.path.replace("/", "")}`}>
              <Card className="h-full hover:border-blue-400/50 hover:shadow-md transition-all cursor-pointer group bg-white">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                    {c.icon}
                  </div>
                  <CardTitle className="text-base text-slate-900 group-hover:text-blue-700 transition-colors">{c.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{c.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-5">About InflationCalc</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Welcome to <strong>InflationCalc</strong> — a free suite of precision financial calculators built for investors, financial planners, and anyone who wants to understand the real value of money over time.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                We believe in the fundamental truth: <em>"What you don't understand, you can't manage."</em> Complex financial formulas often make people give up. Our mission is to turn those formulas into clear, visual, interactive tools — so you can see exactly how time, returns, and inflation interact to shape your financial future.
              </p>
              <p className="text-slate-600 leading-relaxed">
                All 6 calculators use standard financial mathematics (Fisher equation, 4% Rule, compound interest) and US Bureau of Labor Statistics CPI data. Results are estimates for educational and planning purposes.
              </p>
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
                <strong>Disclaimer:</strong> All calculator results are based on mathematical projections and historical data. They do not constitute financial advice. Markets are volatile, and past performance does not guarantee future results. Please consult a qualified financial advisor before making investment decisions.
              </div>
            </div>
            <div className="space-y-4">
              <div className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-2">Why Inflation Matters</div>
              {[
                { stat: "82.5%", desc: "Purchasing power lost — $1,000 in 2000 now takes $1,825 to match" },
                { stat: "2.5%", desc: "Average annual US inflation (2000–2024), compounding silently every year" },
                { stat: "5%+", desc: "Average annual college cost inflation — rising twice as fast as general CPI" },
                { stat: "$1.5M", desc: "Typical FIRE target — but inflation means you need to recalculate in real terms" },
              ].map(item => (
                <div key={item.stat} className="flex gap-4 items-start p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="text-2xl font-extrabold text-blue-600 min-w-[80px]">{item.stat}</div>
                  <div className="text-sm text-slate-600 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Case Scenarios */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Real-World Scenarios</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Whether you're planning for retirement, saving for a child's education, or evaluating a property — inflation changes everything.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.map(s => (
            <div key={s.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{s.icon}</div>
              <h3 className="font-bold text-slate-900 mb-2 text-base">{s.title}</h3>
              <div className="text-blue-700 font-semibold text-sm mb-3 bg-blue-50 rounded-md px-3 py-2">{s.highlight}</div>
              <p className="text-sm text-slate-500 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
