import { useState, useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { AIInsight } from "@/components/ai-insight";
import { Layout } from "@/components/layout";
import { CalcHeader } from "@/components/calc-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
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

export function RealReturn() {
  const [nominalReturn, setNominalReturn] = useState(8);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(20);

  useEffect(() => {
    setPageMeta({
      title: "Real Rate of Return Calculator — Fisher Equation | InflationCalc",
      description: "Calculate your true investment return after inflation using the Fisher equation. See the gap between nominal and real returns and how inflation drag compounds over time.",
      path: "/real-return",
    });
  }, []);

  const realRate = ((1 + nominalReturn / 100) / (1 + inflationRate / 100) - 1) * 100;
  const nominalFinal = amount * Math.pow(1 + nominalReturn / 100, years);
  const realFinal = amount * Math.pow(1 + realRate / 100, years);
  const purchasingPowerPreserved = (realFinal / amount) * 100;
  const inflationDrag = nominalFinal - realFinal;

  const data = Array.from({ length: years + 1 }, (_, yr) => ({
    year: yr,
    nominal: Math.round(amount * Math.pow(1 + nominalReturn / 100, yr)),
    real: Math.round(amount * Math.pow(1 + realRate / 100, yr)),
  }));

  return (
    <Layout>
      <CalcHeader
        title="Real Rate of Return Calculator"
        description="Uses the Fisher equation — ((1 + nominal) ÷ (1 + inflation)) − 1 — to strip inflation from any nominal return, revealing what your investment is actually worth in today's purchasing power."
        icon={<Icon />}
        badge="Fisher Equation"
        breadcrumb="Real Rate of Return"
      />
      <div className="container mx-auto px-4 py-8">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Real Rate of Return", value: `${realRate >= 0 ? "+" : ""}${realRate.toFixed(3)}%`, color: realRate >= 0 ? "text-emerald-700" : "text-red-600", bg: realRate >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100" },
            { label: "Nominal Final Value", value: `$${Math.round(nominalFinal).toLocaleString()}`, color: "text-slate-800", bg: "bg-white" },
            { label: "Real Final Value", value: `$${Math.round(realFinal).toLocaleString()}`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
            { label: "Lost to Inflation", value: `-$${Math.round(inflationDrag).toLocaleString()}`, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`} data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}>
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
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium text-slate-700">Nominal Return</Label>
                  <span className="text-sm font-bold text-blue-600">{nominalReturn}%</span>
                </div>
                <input type="range" min={0} max={30} step={0.1} value={nominalReturn} onChange={e => setNominalReturn(Number(e.target.value))} data-testid="input-nominal-return" className="w-full accent-blue-600 h-1.5" />
                <div className="flex justify-between text-xs text-slate-400"><span>0%</span><span>30%</span></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium text-slate-700">Inflation Rate</Label>
                  <span className="text-sm font-bold text-blue-600">{inflationRate}%</span>
                </div>
                <input type="range" min={0} max={15} step={0.1} value={inflationRate} onChange={e => setInflationRate(Number(e.target.value))} data-testid="input-inflation" className="w-full accent-blue-600 h-1.5" />
                <div className="flex justify-between text-xs text-slate-400"><span>0%</span><span>15%</span></div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Investment Amount</Label>
                <AmountField value={amount} onChange={setAmount} testId="input-amount" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium text-slate-700">Time Horizon</Label>
                  <span className="text-sm font-bold text-blue-600">{years} yr</span>
                </div>
                <input type="range" min={1} max={40} value={years} onChange={e => setYears(Number(e.target.value))} data-testid="slider-years" className="w-full accent-blue-600 h-1.5" />
                <div className="flex justify-between text-xs text-slate-400"><span>1</span><span>40</span></div>
              </div>

              {/* Formula box */}
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs leading-relaxed">
                <div className="text-slate-400 mb-2 font-sans font-medium text-xs">Fisher Equation</div>
                <div className="text-slate-300">real = (1 + {nominalReturn}%)</div>
                <div className="text-slate-300 pl-6">÷ (1 + {inflationRate}%) − 1</div>
                <div className={`mt-2 font-bold text-base ${realRate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  = {realRate >= 0 ? "+" : ""}{realRate.toFixed(3)}%
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between"><span>Purchasing Power Preserved</span><span className={`font-medium ${purchasingPowerPreserved >= 100 ? "text-emerald-600" : "text-orange-500"}`}>{purchasingPowerPreserved.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span>Breakeven Nominal</span><span className="font-medium text-slate-600">{inflationRate.toFixed(2)}%</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800">Nominal vs Real Growth Over {years} Years</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} formatter={v => `$${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      <Line type="monotone" dataKey="nominal" name="Nominal Value" stroke="#94a3b8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="real" name="Real Value (today's $)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={`mt-4 p-3 rounded-lg text-sm border ${realRate > 0 ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-800 border-red-100"}`}>
                  {realRate > 0
                    ? `Your ${nominalReturn}% nominal return outpaces ${inflationRate}% inflation by ${realRate.toFixed(2)}%/yr. After ${years} years, your $${amount.toLocaleString()} grows to $${Math.round(nominalFinal).toLocaleString()} nominally — but only $${Math.round(realFinal).toLocaleString()} in today's dollars. Inflation quietly consumed $${Math.round(inflationDrag).toLocaleString()}.`
                    : `Your nominal return is below inflation — you're losing ${Math.abs(realRate).toFixed(2)}%/yr of purchasing power. In real terms, your $${amount.toLocaleString()} will be worth only $${Math.round(realFinal).toLocaleString()} after ${years} years.`
                  }
                </div>
                <AIInsight
                  calculator="Real Rate of Return"
                  data={[
                    { label: "Nominal Return", value: `${nominalReturn}%` },
                    { label: "Inflation Rate", value: `${inflationRate}%` },
                    { label: "Investment Amount", value: `$${amount.toLocaleString()}` },
                    { label: "Time Horizon", value: `${years} years` },
                    { label: "Real Rate of Return", value: `${realRate.toFixed(3)}%` },
                    { label: "Nominal Final Value", value: `$${Math.round(nominalFinal).toLocaleString()}` },
                    { label: "Real Final Value (today's $)", value: `$${Math.round(realFinal).toLocaleString()}` },
                    { label: "Lost to Inflation", value: `$${Math.round(inflationDrag).toLocaleString()}` },
                    { label: "Purchasing Power Preserved", value: `${purchasingPowerPreserved.toFixed(1)}%` },
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
