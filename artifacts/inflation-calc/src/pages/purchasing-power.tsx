import { useState, useEffect } from "react";
import { setPageMeta } from "@/lib/seo";
import { AIInsight } from "@/components/ai-insight";
import { Layout } from "@/components/layout";
import { CalcHeader } from "@/components/calc-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

const CPI_DATA: Record<number, number> = {
  1960: 29.6, 1961: 29.9, 1962: 30.2, 1963: 30.6, 1964: 31.0,
  1965: 31.5, 1966: 32.5, 1967: 33.4, 1968: 34.8, 1969: 36.7,
  1970: 38.8, 1971: 40.5, 1972: 41.8, 1973: 44.4, 1974: 49.3,
  1975: 53.8, 1976: 56.9, 1977: 60.6, 1978: 65.2, 1979: 72.6,
  1980: 82.4, 1981: 90.9, 1982: 96.5, 1983: 99.6, 1984: 103.9,
  1985: 107.6, 1986: 109.6, 1987: 113.6, 1988: 118.3, 1989: 124.0,
  1990: 130.7, 1991: 136.2, 1992: 140.3, 1993: 144.5, 1994: 148.2,
  1995: 152.4, 1996: 156.9, 1997: 160.5, 1998: 163.0, 1999: 166.6,
  2000: 172.2, 2001: 177.1, 2002: 179.9, 2003: 184.0, 2004: 188.9,
  2005: 195.3, 2006: 201.6, 2007: 207.3, 2008: 215.3, 2009: 214.5,
  2010: 218.1, 2011: 224.9, 2012: 229.6, 2013: 233.0, 2014: 236.7,
  2015: 237.0, 2016: 240.0, 2017: 245.1, 2018: 251.1, 2019: 255.7,
  2020: 258.8, 2021: 271.0, 2022: 292.7, 2023: 304.7, 2024: 314.2,
  2025: 321.9, 2026: 325.8,
};

const ESTIMATED_FROM = 2025; // BLS 2025 preliminary; 2026 partial-year estimate

const YEARS = Object.keys(CPI_DATA).map(Number);

const Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

function AmountField({ value, onChange, testId }: { value: number; onChange: (v: number) => void; testId: string }) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const sanitize = (v: string) => v.replace(/[^0-9.]/g, "").replace(/^0+(\d)/, "$1");
  useEffect(() => { if (!focused) setRaw(String(value)); }, [value, focused]);
  return (
    <Input
      type="text" inputMode="decimal" value={raw}
      onFocus={() => setFocused(true)}
      onChange={e => { const s = sanitize(e.target.value); setRaw(s); const n = parseFloat(s); if (!isNaN(n)) onChange(n); }}
      onBlur={() => { setFocused(false); if (!raw) setRaw(String(value)); }}
      data-testid={testId} className="border-slate-200 focus:border-blue-400"
    />
  );
}

export function PurchasingPower() {
  const [amount, setAmount] = useState(1000);
  const [startYear, setStartYear] = useState(2000);
  const [endYear, setEndYear] = useState(2026);

  useEffect(() => {
    setPageMeta({
      title: "Purchasing Power Calculator — CPI Inflation 1960–2026 | InflationCalc",
      description: "Compare the real value of money across any year from 1960 to 2026 using official US BLS CPI data. See exactly how much inflation has eroded your dollar.",
      path: "/purchasing-power",
    });
  }, []);

  const startCPI = CPI_DATA[startYear] ?? 1;
  const endCPI = CPI_DATA[endYear] ?? 1;
  const equivalentValue = (amount * endCPI) / startCPI;
  const totalChange = ((equivalentValue - amount) / amount) * 100;
  const numYears = Math.abs(endYear - startYear);
  const avgAnnual = numYears > 0 ? (Math.pow(endCPI / startCPI, 1 / numYears) - 1) * 100 : 0;

  const minYear = Math.min(startYear, endYear);
  const maxYear = Math.max(startYear, endYear);
  const step = Math.max(1, Math.floor((maxYear - minYear) / 12));
  const chartData: { year: number; value: number }[] = [];
  for (let y = minYear; y <= maxYear; y += step) {
    if (CPI_DATA[y]) chartData.push({ year: y, value: Math.round((amount * CPI_DATA[y]) / startCPI) });
  }
  if (chartData[chartData.length - 1]?.year !== maxYear && CPI_DATA[maxYear]) {
    chartData.push({ year: maxYear, value: Math.round((amount * CPI_DATA[maxYear]) / startCPI) });
  }

  return (
    <Layout>
      <CalcHeader
        title="Purchasing Power Calculator"
        description="Using official US BLS CPI data (1960–2025) plus a 2026 partial-year estimate to show exactly how much inflation has eroded — or amplified — the real value of money over any time span."
        icon={<Icon />}
        badge="US BLS CPI 1960–2026"
        breadcrumb="Purchasing Power"
      />
      <div className="container mx-auto px-4 py-8">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: `Original (${startYear})`, value: `$${amount.toLocaleString()}`, color: "text-slate-800", bg: "bg-white" },
            { label: `Equivalent (${endYear})`, value: `$${Math.round(equivalentValue).toLocaleString()}`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
            { label: "Total Change", value: `${totalChange >= 0 ? "+" : ""}${totalChange.toFixed(1)}%`, color: totalChange >= 0 ? "text-red-600" : "text-emerald-600", bg: totalChange >= 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100" },
            { label: "Avg Annual Inflation", value: `${avgAnnual.toFixed(2)}%/yr`, color: "text-slate-700", bg: "bg-white" },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`} data-testid={`kpi-${k.label.toLowerCase().replace(/[\s()]/g, "-")}`}>
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
              <div>
                <Label className="text-sm font-medium text-slate-700">Amount</Label>
                <div className="flex items-center mt-1.5">
                  <span className="text-slate-400 text-sm mr-2">$</span>
                  <AmountField value={amount} onChange={setAmount} testId="input-amount" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium text-slate-700">Start Year</Label>
                  <span className="text-sm font-bold text-blue-600">{startYear}</span>
                </div>
                <input type="range" min={YEARS[0]} max={YEARS[YEARS.length - 1]} step={1} value={startYear} onChange={e => setStartYear(Number(e.target.value))} data-testid="slider-start-year" className="w-full accent-blue-600 h-1.5" />
                <div className="flex justify-between text-xs text-slate-400"><span>1960</span><span>2026</span></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium text-slate-700">End Year</Label>
                  <span className="text-sm font-bold text-blue-600">
                    {endYear}{endYear >= ESTIMATED_FROM ? <span className="text-xs text-amber-500 ml-1">*est</span> : null}
                  </span>
                </div>
                <input type="range" min={YEARS[0]} max={YEARS[YEARS.length - 1]} step={1} value={endYear} onChange={e => setEndYear(Number(e.target.value))} data-testid="slider-end-year" className="w-full accent-blue-600 h-1.5" />
                <div className="flex justify-between text-xs text-slate-400"><span>1960</span><span>2026</span></div>
              </div>
              {(startYear >= ESTIMATED_FROM || endYear >= ESTIMATED_FROM) && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                  * 2025 is a BLS preliminary annual figure. 2026 is a partial-year estimate (Jan–Apr).
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between"><span>Span</span><span className="font-medium text-slate-600">{numYears} years</span></div>
                <div className="flex justify-between"><span>Real Purchasing Power</span><span className="font-medium text-slate-600">{((amount / equivalentValue) * 100).toFixed(1)}% of original</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800">Equivalent Value Over Time</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                        formatter={(v) => [`$${Number(v).toLocaleString()}`, "Equivalent Value"]}
                      />
                      <ReferenceLine y={amount} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `$${amount.toLocaleString()} baseline`, fill: "#94a3b8", fontSize: 10 }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.year} fill={entry.year === maxYear ? "#3b82f6" : "#93c5fd"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                  What cost <strong>${amount.toLocaleString()}</strong> in <strong>{startYear}</strong> would cost approximately <strong>${Math.round(equivalentValue).toLocaleString()}</strong> in <strong>{endYear}</strong> — a <strong>{Math.abs(totalChange).toFixed(1)}%</strong> {totalChange >= 0 ? "increase" : "decrease"} over {numYears} years. Average annual inflation: <strong>{avgAnnual.toFixed(2)}%</strong>. Source: US Bureau of Labor Statistics CPI-U.
                </div>
                <AIInsight
                  calculator="Purchasing Power"
                  data={[
                    { label: "Original Amount", value: `$${amount.toLocaleString()}` },
                    { label: "Start Year", value: String(startYear) },
                    { label: "End Year", value: String(endYear) },
                    { label: "Years Span", value: String(numYears) },
                    { label: "Equivalent Value", value: `$${Math.round(equivalentValue).toLocaleString()}` },
                    { label: "Total Inflation Change", value: `${totalChange.toFixed(1)}%` },
                    { label: "Average Annual Inflation", value: `${avgAnnual.toFixed(2)}%` },
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
