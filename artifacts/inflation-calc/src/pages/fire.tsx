import { useState, useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { AIInsight } from "@/components/ai-insight";
import { Layout } from "@/components/layout";
import { CalcHeader } from "@/components/calc-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

const Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

function Field({ label, value, onChange, prefix, testId }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; testId: string }) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const sanitize = (v: string) => v.replace(/[^0-9.]/g, "").replace(/^0+(\d)/, "$1");
  useEffect(() => { if (!focused) setRaw(String(value)); }, [value, focused]);
  return (
    <div>
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="flex items-center mt-1.5">
        {prefix && <span className="text-slate-400 text-sm mr-2">{prefix}</span>}
        <Input
          type="text" inputMode="decimal" value={raw}
          onFocus={() => setFocused(true)}
          onChange={e => { const s = sanitize(e.target.value); setRaw(s); const n = parseFloat(s); if (!isNaN(n)) onChange(n); }}
          onBlur={() => { setFocused(false); if (!raw) setRaw(String(value)); }}
          data-testid={testId} className="border-slate-200 focus:border-blue-400"
        />
      </div>
    </div>
  );
}

function RangeField({ label, value, onChange, min, max, step, suffix, testId }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; suffix: string; testId: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        <span className="text-sm font-bold text-blue-600">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} data-testid={testId} className="w-full accent-blue-600 h-1.5" />
      <div className="flex justify-between text-xs text-slate-400"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
    </div>
  );
}

export function Fire() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(50);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [monthlySavings, setMonthlySavings] = useState(2000);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [annualSpending, setAnnualSpending] = useState(60000);

  useEffect(() => {
    setPageMeta({
      title: "FIRE Retirement Calculator — Inflation-Adjusted | InflationCalc",
      description: "Calculate your real FIRE number and retirement timeline with inflation built in. Uses the 4% rule with inflation-adjusted safe withdrawal rates.",
      path: "/fire",
    });
  }, []);

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const fiNumber = annualSpending * 25;
  const realReturn = ((1 + annualReturn / 100) / (1 + inflationRate / 100) - 1) * 100;

  const data: { age: number; portfolio: number; fiTarget: number }[] = [];
  let portfolio = currentSavings;
  let fireAge: number | null = null;

  for (let yr = 0; yr <= Math.max(yearsToRetirement + 10, 30); yr++) {
    const age = currentAge + yr;
    const inflatedFI = fiNumber * Math.pow(1 + inflationRate / 100, yr);
    if (portfolio >= inflatedFI && fireAge === null) fireAge = age;
    data.push({ age, portfolio: Math.round(portfolio), fiTarget: Math.round(inflatedFI) });
    portfolio = portfolio * (1 + annualReturn / 100) + monthlySavings * 12;
  }

  const portfolioAtRetirement = data[yearsToRetirement]?.portfolio ?? 0;
  const inflatedFiAtRetirement = fiNumber * Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const onTrack = portfolioAtRetirement >= inflatedFiAtRetirement;
  const safeWithdrawal = portfolioAtRetirement * 0.04;
  const realSafeWithdrawal = safeWithdrawal / Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const gap = portfolioAtRetirement - inflatedFiAtRetirement;

  return (
    <Layout>
      <CalcHeader
        title="FIRE / Retirement Calculator"
        description="Financial Independence, Retire Early — with inflation baked in. Uses the 4% safe withdrawal rule (Bengen, 1994) and Fisher equation for real return."
        icon={<Icon />}
        badge="4% SWR Rule"
        breadcrumb="FIRE / Retirement"
      />
      <div className="container mx-auto px-4 py-8">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "FI Number (25×)", value: `$${fiNumber.toLocaleString()}`, color: "text-slate-800", bg: "bg-white" },
            { label: "Portfolio at Retirement", value: `$${portfolioAtRetirement.toLocaleString()}`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
            { label: "FIRE Status", value: onTrack ? "On Track" : "Deficit", color: onTrack ? "text-emerald-700" : "text-red-600", bg: onTrack ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100" },
            { label: "Surplus / Gap", value: `${gap >= 0 ? "+" : ""}$${Math.abs(Math.round(gap)).toLocaleString()}`, color: gap >= 0 ? "text-emerald-700" : "text-red-600", bg: "bg-white" },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`} data-testid={`kpi-${k.label.toLowerCase().replace(/\s+\/?\s*/g, "-")}`}>
              <div className="text-xs text-slate-500 mb-1 font-medium">{k.label}</div>
              <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-slate-800">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <Field label="Current Age" value={currentAge} onChange={setCurrentAge} testId="input-current-age" />
              <Field label="Target Retirement Age" value={retirementAge} onChange={setRetirementAge} testId="input-retirement-age" />
              <Field label="Current Savings" value={currentSavings} onChange={setCurrentSavings} prefix="$" testId="input-current-savings" />
              <Field label="Monthly Savings" value={monthlySavings} onChange={setMonthlySavings} prefix="$" testId="input-monthly-savings" />
              <Field label="Annual Spending in Retirement" value={annualSpending} onChange={setAnnualSpending} prefix="$" testId="input-spending" />
              <RangeField label="Expected Annual Return" value={annualReturn} onChange={setAnnualReturn} min={0} max={15} step={0.1} suffix="%" testId="input-return" />
              <RangeField label="Inflation Rate" value={inflationRate} onChange={setInflationRate} min={0} max={10} step={0.1} suffix="%" testId="input-inflation" />
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between"><span>Real Return</span><span className="font-medium text-slate-600">{realReturn.toFixed(2)}%</span></div>
                <div className="flex justify-between"><span>Safe Withdrawal (4%)</span><span className="font-medium text-slate-600">${Math.round(safeWithdrawal).toLocaleString()}/yr</span></div>
                <div className="flex justify-between"><span>Real Withdrawal (today's $)</span><span className="font-medium text-slate-600">${Math.round(realSafeWithdrawal).toLocaleString()}/yr</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800">Portfolio Growth vs Inflation-Adjusted FI Target</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="age" label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      {retirementAge > currentAge && (
                        <ReferenceLine x={retirementAge} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Retirement", fill: "#94a3b8", fontSize: 10 }} />
                      )}
                      <Line type="monotone" dataKey="portfolio" name="Portfolio Value" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="fiTarget" name="FI Target (inflation-adj.)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={`mt-4 p-3 rounded-lg text-sm border ${onTrack ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-amber-50 text-amber-800 border-amber-100"}`} data-testid="result-fire-age">
                  {onTrack
                    ? `Your portfolio is projected to reach the inflation-adjusted FI target at age ${fireAge ?? retirementAge}. Real safe withdrawal: $${Math.round(realSafeWithdrawal).toLocaleString()}/year in today's dollars — vs your target spending of $${annualSpending.toLocaleString()}.`
                    : `At retirement age ${retirementAge}, your portfolio ($${portfolioAtRetirement.toLocaleString()}) falls $${Math.abs(Math.round(gap)).toLocaleString()} short of the inflation-adjusted FI target ($${Math.round(inflatedFiAtRetirement).toLocaleString()}). Increase savings or adjust your timeline.`
                  }
                </div>
                <AIInsight
                  calculator="FIRE / Retirement"
                  data={[
                    { label: "Current Age", value: String(currentAge) },
                    { label: "Target Retirement Age", value: String(retirementAge) },
                    { label: "Current Savings", value: `$${currentSavings.toLocaleString()}` },
                    { label: "Monthly Savings", value: `$${monthlySavings.toLocaleString()}` },
                    { label: "Annual Spending", value: `$${annualSpending.toLocaleString()}` },
                    { label: "Expected Annual Return", value: `${annualReturn}%` },
                    { label: "Inflation Rate", value: `${inflationRate}%` },
                    { label: "FIRE Number (25x spending)", value: `$${fiNumber.toLocaleString()}` },
                    { label: "Portfolio at Target Age", value: `$${portfolioAtRetirement.toLocaleString()}` },
                    { label: "On Track", value: onTrack ? "Yes" : "No" },
                    { label: "Projected FIRE Age", value: fireAge ? String(fireAge) : "Not reached in projection" },
                    { label: "Real Safe Withdrawal/yr", value: `$${Math.round(realSafeWithdrawal).toLocaleString()}` },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
