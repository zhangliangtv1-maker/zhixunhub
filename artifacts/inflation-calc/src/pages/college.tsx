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
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);

function Field({ label, value, onChange, prefix, note, testId }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; step?: number; note?: string; testId: string }) {
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
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </div>
  );
}

export function College() {
  const [childAge, setChildAge] = useState(5);
  const [collegeAge, setCollegeAge] = useState(18);
  const [currentSavings, setCurrentSavings] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(300);
  const [collegeCostToday, setCollegeCostToday] = useState(30000);
  const [collegeInflation, setCollegeInflation] = useState(5);
  const [expectedReturn, setExpectedReturn] = useState(6);

  useEffect(() => {
    setPageMeta({
      title: "College Savings Calculator — Education Inflation | InflationCalc",
      description: "Project the real future cost of college with education inflation. See if your 529 or savings plan is on track to cover tuition when your child enrolls.",
      path: "/college",
    });
  }, []);

  const yearsToCollege = Math.max(0, collegeAge - childAge);
  const data: { year: number; savings: number; projectedCost: number }[] = [];
  let savings = currentSavings;
  for (let yr = 0; yr <= yearsToCollege; yr++) {
    const projectedCost = collegeCostToday * Math.pow(1 + collegeInflation / 100, yr) * 4;
    data.push({ year: childAge + yr, savings: Math.round(savings), projectedCost: Math.round(projectedCost) });
    if (yr < yearsToCollege) savings = savings * (1 + expectedReturn / 100) + monthlyContribution * 12;
  }

  const finalSavings = data[data.length - 1]?.savings ?? 0;
  const projectedCost = collegeCostToday * Math.pow(1 + collegeInflation / 100, yearsToCollege) * 4;
  const surplus = finalSavings - projectedCost;
  const percentCovered = Math.min(100, (finalSavings / projectedCost) * 100);
  const annualCostAtStart = collegeCostToday * Math.pow(1 + collegeInflation / 100, yearsToCollege);

  return (
    <Layout>
      <CalcHeader
        title="College Savings Calculator"
        description="College costs have historically inflated at ~5%/year — twice the general CPI rate. See if your savings plan will cover the real bill when it arrives."
        icon={<Icon />}
        badge="~5%/yr Education Inflation"
        breadcrumb="College Savings"
      />
      <div className="container mx-auto px-4 py-8">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Years Until College", value: `${yearsToCollege} yrs`, color: "text-slate-800", bg: "bg-white" },
            { label: "Projected Savings", value: `$${finalSavings.toLocaleString()}`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
            { label: "Projected Total Cost", value: `$${Math.round(projectedCost).toLocaleString()}`, color: "text-slate-800", bg: "bg-white" },
            { label: surplus >= 0 ? "Surplus" : "Deficit", value: `${surplus >= 0 ? "+" : ""}$${Math.abs(Math.round(surplus)).toLocaleString()}`, color: surplus >= 0 ? "text-emerald-700" : "text-red-600", bg: surplus >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100" },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
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
              <Field label="Child's Current Age" value={childAge} onChange={setChildAge} testId="input-child-age" />
              <Field label="College Start Age" value={collegeAge} onChange={setCollegeAge} testId="input-college-age" />
              <Field label="Current Savings" value={currentSavings} onChange={setCurrentSavings} prefix="$" testId="input-current-savings" />
              <Field label="Monthly Contribution" value={monthlyContribution} onChange={setMonthlyContribution} prefix="$" testId="input-monthly" />
              <Field label="Annual College Cost Today" value={collegeCostToday} onChange={setCollegeCostToday} prefix="$" note="Per year — total shown as 4-year program" testId="input-college-cost" />
              <Field label="College Inflation Rate (%)" value={collegeInflation} onChange={setCollegeInflation} step={0.1} testId="input-college-inflation" />
              <Field label="Expected Return on Savings (%)" value={expectedReturn} onChange={setExpectedReturn} step={0.1} testId="input-return" />
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between"><span>Annual cost at start</span><span className="font-medium text-slate-600">${Math.round(annualCostAtStart).toLocaleString()}/yr</span></div>
                <div className="flex justify-between"><span>Coverage</span><span className={`font-medium ${percentCovered >= 100 ? "text-emerald-600" : "text-orange-500"}`}>{percentCovered.toFixed(1)}%</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800">Savings vs Projected Cost (4-Year Total)</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" label={{ value: "Child's Age", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} formatter={(v) => `$${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      <Area type="monotone" dataKey="projectedCost" name="Projected Cost (4-yr)" stroke="#f59e0b" strokeWidth={2} fill="url(#costGrad)" />
                      <Area type="monotone" dataKey="savings" name="Projected Savings" stroke="#3b82f6" strokeWidth={2} fill="url(#savingsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className={`mt-4 p-3 rounded-lg text-sm border ${surplus >= 0 ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-amber-50 text-amber-800 border-amber-100"}`}>
                  {surplus >= 0
                    ? `Your savings plan is on track — projected to cover the full 4-year cost with a $${Math.round(surplus).toLocaleString()} surplus.`
                    : `Your plan covers ${percentCovered.toFixed(0)}% of projected costs. To close the $${Math.abs(Math.round(surplus)).toLocaleString()} gap, consider increasing monthly contributions or a higher-return vehicle like a 529 plan.`
                  }
                </div>
                <AIInsight
                  calculator="College Savings"
                  data={[
                    { label: "Child's Current Age", value: String(childAge) },
                    { label: "College Start Age", value: String(collegeAge) },
                    { label: "Years Until College", value: String(yearsToCollege) },
                    { label: "Current Savings", value: `$${currentSavings.toLocaleString()}` },
                    { label: "Monthly Contribution", value: `$${monthlyContribution.toLocaleString()}` },
                    { label: "Current Annual Tuition", value: `$${collegeCostToday.toLocaleString()}` },
                    { label: "Education Inflation Rate", value: `${collegeInflation}%/yr` },
                    { label: "Expected Investment Return", value: `${expectedReturn}%` },
                    { label: "Projected Savings", value: `$${Math.round(finalSavings).toLocaleString()}` },
                    { label: "Projected 4-Year Cost", value: `$${Math.round(projectedCost).toLocaleString()}` },
                    { label: surplus >= 0 ? "Surplus" : "Deficit", value: `$${Math.abs(Math.round(surplus)).toLocaleString()}` },
                    { label: "Coverage", value: `${percentCovered.toFixed(1)}%` },
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
