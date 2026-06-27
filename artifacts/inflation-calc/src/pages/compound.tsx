import { useState, useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { AIInsight } from "@/components/ai-insight";
import { Layout } from "@/components/layout";
import { CalcHeader } from "@/components/calc-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

function AmountField({ value, onChange, testId }: { value: number; onChange: (v: number) => void; testId: string }) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const sanitize = (v: string) => v.replace(/[^0-9.]/g, "").replace(/^0+(\d)/, "$1");
  useEffect(() => { if (!focused) setRaw(String(value)); }, [value, focused]);
  return (
    <div className="flex items-center mt-1.5">
      <span className="text-slate-400 text-sm mr-2">$</span>
      <Input
        type="text" inputMode="decimal" value={raw}
        onFocus={() => setFocused(true)}
        onChange={e => { const s = sanitize(e.target.value); setRaw(s); const n = parseFloat(s); if (!isNaN(n)) onChange(n); }}
        onBlur={() => { setFocused(false); if (!raw) setRaw(String(value)); }}
        data-testid={testId} className="border-slate-200 focus:border-blue-400"
      />
    </div>
  );
}

function RangeInput({ label, value, onChange, min, max, step, testId, suffix = "" }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; testId: string; suffix?: string;
}) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const sanitize = (v: string) => v.replace(/[^0-9.]/g, "").replace(/^0+(\d)/, "$1");
  useEffect(() => { if (!focused) setRaw(String(value)); }, [value, focused]);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="text" inputMode="decimal" value={raw}
            onFocus={() => setFocused(true)}
            onChange={e => { const s = sanitize(e.target.value); setRaw(s); const n = parseFloat(s); if (!isNaN(n)) onChange(n); }}
            onBlur={() => { setFocused(false); if (!raw) setRaw(String(value)); }}
            data-testid={testId}
            className="w-24 h-7 text-sm text-right font-semibold border-slate-200 focus:border-blue-400"
          />
          {suffix && <span className="text-xs text-slate-400 font-medium">{suffix}</span>}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => { onChange(Number(e.target.value)); setRaw(String(e.target.value)); }}
        className="w-full accent-blue-600 h-1.5"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );
}

export function Compound() {
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [rate, setRate] = useState(7);
  const [inflation, setInflation] = useState(2.5);
  const [years, setYears] = useState(20);

  useEffect(() => {
    setPageMeta({
      title: "Inflation-Adjusted Compound Interest Calculator | InflationCalc",
      description: "Calculate real returns after inflation. See exactly how much your investments are worth in today's dollars — not just nominal growth. Free compound interest calculator.",
      path: "/compound",
    });
  }, []);

  const data: { year: string; nominal: number; real: number; contributions: number }[] = [];
  let currentNominal = initial;
  let currentContributions = initial;

  for (let i = 0; i <= years; i++) {
    const realValue = currentNominal / Math.pow(1 + inflation / 100, i);
    data.push({ year: `Yr ${i}`, nominal: Math.round(currentNominal), real: Math.round(realValue), contributions: Math.round(currentContributions) });
    if (i < years) {
      currentNominal = currentNominal * (1 + rate / 100) + monthly * 12;
      currentContributions += monthly * 12;
    }
  }

  const finalData = data[data.length - 1];
  const inflationLoss = finalData.nominal - finalData.real;
  const interestEarned = finalData.nominal - finalData.contributions;

  return (
    <Layout>
      <CalcHeader
        title="Compound Interest & Inflation Calculator"
        description="See how your investments grow over time — and how much inflation quietly erodes your real purchasing power."
        icon={<Icon />}
        badge="Inflation-Adjusted"
        breadcrumb="Compound Interest"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Result KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Nominal Final Value", value: `$${finalData.nominal.toLocaleString()}`, color: "text-slate-800", bg: "bg-white" },
            { label: "Real Value (Today's $)", value: `$${finalData.real.toLocaleString()}`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
            { label: "Interest Earned", value: `+$${interestEarned.toLocaleString()}`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
            { label: "Lost to Inflation", value: `-$${inflationLoss.toLocaleString()}`, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`} data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="text-xs text-slate-500 mb-1 font-medium">{k.label}</div>
              <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Inputs */}
          <Card className="md:col-span-1 border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-slate-800">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div>
                <Label className="text-sm font-medium text-slate-700">Initial Amount</Label>
                <AmountField value={initial} onChange={setInitial} testId="input-initial" />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Monthly Contribution</Label>
                <AmountField value={monthly} onChange={setMonthly} testId="input-monthly" />
              </div>
              <RangeInput label="Annual Return" value={rate} onChange={setRate} min={0} max={20} step={0.1} testId="input-rate" suffix="%" />
              <RangeInput label="Annual Inflation" value={inflation} onChange={setInflation} min={0} max={15} step={0.1} testId="input-inflation" suffix="%" />
              <RangeInput label="Time Horizon" value={years} onChange={setYears} min={1} max={50} step={1} testId="input-years" suffix=" yr" />

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between"><span>Total Contributions</span><span className="font-medium text-slate-600">${finalData.contributions.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Real Return Rate</span><span className="font-medium text-slate-600">{(((1 + rate/100)/(1 + inflation/100)) - 1).toFixed(2)}%</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <div className="md:col-span-2">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800">Nominal vs Real Growth Over {years} Years</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="nominalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={Math.floor(years / 5)} />
                      <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                        formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      <Area type="monotone" dataKey="nominal" name="Nominal Value" stroke="#94a3b8" strokeWidth={1.5} fill="url(#nominalGrad)" />
                      <Area type="monotone" dataKey="real" name="Real Value (Inflation-Adjusted)" stroke="#3b82f6" strokeWidth={2} fill="url(#realGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                  After {years} years, your <strong>${initial.toLocaleString()}</strong> initial investment + <strong>${monthly}/mo</strong> grows to <strong>${finalData.nominal.toLocaleString()}</strong> nominally — but only <strong>${finalData.real.toLocaleString()}</strong> in today's purchasing power after {inflation}% annual inflation. Inflation silently eroded <strong>${inflationLoss.toLocaleString()}</strong> of your wealth.
                </div>
                <AIInsight
                  calculator="Compound Interest"
                  data={[
                    { label: "Initial Amount", value: `$${initial.toLocaleString()}` },
                    { label: "Monthly Contribution", value: `$${monthly.toLocaleString()}` },
                    { label: "Annual Return", value: `${rate}%` },
                    { label: "Annual Inflation", value: `${inflation}%` },
                    { label: "Time Horizon", value: `${years} years` },
                    { label: "Nominal Final Value", value: `$${finalData.nominal.toLocaleString()}` },
                    { label: "Real Final Value (today's $)", value: `$${finalData.real.toLocaleString()}` },
                    { label: "Interest Earned", value: `$${interestEarned.toLocaleString()}` },
                    { label: "Lost to Inflation", value: `$${inflationLoss.toLocaleString()}` },
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
