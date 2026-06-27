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
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

function Field({ label, value, onChange, prefix, suffix, testId }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number; testId: string }) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const sanitize = (v: string) => v.replace(/[^0-9.]/g, "").replace(/^0+(\d)/, "$1");
  useEffect(() => { if (!focused) setRaw(String(value)); }, [value, focused]);
  return (
    <div>
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="flex items-center mt-1.5 gap-1">
        {prefix && <span className="text-slate-400 text-sm">{prefix}</span>}
        <Input
          type="text" inputMode="decimal" value={raw}
          onFocus={() => setFocused(true)}
          onChange={e => { const s = sanitize(e.target.value); setRaw(s); const n = parseFloat(s); if (!isNaN(n)) onChange(n); }}
          onBlur={() => { setFocused(false); if (!raw) setRaw(String(value)); }}
          data-testid={testId} className="border-slate-200 focus:border-blue-400"
        />
        {suffix && <span className="text-slate-400 text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

type Mode = "investment" | "primary";

export function RealEstate() {
  const [mode, setMode] = useState<Mode>("investment");
  const [purchasePrice, setPurchasePrice] = useState(400000);
  const [downPayment, setDownPayment] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [appreciation, setAppreciation] = useState(3.5);
  const [annualRentalIncome, setAnnualRentalIncome] = useState(24000);
  const [annualExpenses, setAnnualExpenses] = useState(8000);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [years, setYears] = useState(20);

  useEffect(() => {
    setPageMeta({
      title: "Real Estate Inflation Calculator — True ROI After Inflation | InflationCalc",
      description: "See the real ROI on your property after inflation. Calculate inflation-adjusted equity, cap rate, true all-in returns, and sunk costs for rental or primary residence.",
      path: "/real-estate",
    });
  }, []);

  const loanAmount = purchasePrice * (1 - downPayment / 100);
  const monthlyRate = mortgageRate / 100 / 12;
  const numPayments = loanTerm * 12;
  const monthlyPayment = loanAmount > 0 && monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmount / numPayments;

  const data: { year: number; nominalValue: number; realValue: number; equity: number; realEquity: number }[] = [];
  for (let yr = 0; yr <= Math.min(years, loanTerm); yr++) {
    const nominalValue = purchasePrice * Math.pow(1 + appreciation / 100, yr);
    const realValue = nominalValue / Math.pow(1 + inflationRate / 100, yr);
    let bal = loanAmount;
    for (let m = 0; m < yr * 12; m++) {
      const int = bal * monthlyRate;
      bal = Math.max(0, bal - (monthlyPayment - int));
    }
    const equity = nominalValue - bal;
    const realEquity = equity / Math.pow(1 + inflationRate / 100, yr);
    data.push({ year: yr, nominalValue: Math.round(nominalValue), realValue: Math.round(realValue), equity: Math.round(equity), realEquity: Math.round(realEquity) });
  }

  const finalData = data[data.length - 1] ?? data[0];
  const downPaymentAmount = purchasePrice * (downPayment / 100);

  // Interest paid over holding period
  let bal = loanAmount;
  let totalInterestPaid = 0;
  for (let m = 0; m < years * 12; m++) {
    const int = bal * monthlyRate;
    totalInterestPaid += int;
    bal = Math.max(0, bal - (monthlyPayment - int));
  }

  const totalMortgagePayments = monthlyPayment * 12 * years;
  const totalExpenses = annualExpenses * years;
  const totalRentalIncome = annualRentalIncome * years;

  // ── Investment mode ──
  // All cash out vs all cash in (including rental income + sale proceeds)
  const invTotalCashOut = downPaymentAmount + totalMortgagePayments + totalExpenses;
  const invTotalCashIn = totalRentalIncome + finalData.realEquity;
  const trueROI = invTotalCashOut > 0 ? ((invTotalCashIn - invTotalCashOut) / invTotalCashOut) * 100 : 0;
  const annualNOI = annualRentalIncome - annualExpenses - monthlyPayment * 12;
  const capRate = ((annualRentalIncome - annualExpenses) / purchasePrice) * 100;
  const cashOnCash = downPaymentAmount > 0 ? (annualNOI / downPaymentAmount) * 100 : 0;

  // ── Primary residence mode ──
  // Sunk cost = interest + expenses (these are gone; principal just becomes equity)
  const sunkCost = totalInterestPaid + totalExpenses;
  // Equity gain above the initial down payment
  const equityGain = finalData.realEquity - downPaymentAmount;
  // Net position: equity gain minus sunk costs
  const netGain = equityGain - sunkCost;
  // Effective housing cost per year (sunk cost not recovered by equity growth)
  const annualHousingCost = sunkCost > 0 ? Math.round(sunkCost / years) : 0;

  const isInvestment = mode === "investment";

  return (
    <Layout>
      <CalcHeader
        title="Real Estate Inflation Calculator"
        description={isInvestment
          ? "Analyze your rental property's true all-in ROI after inflation, including every dollar of mortgage payments and expenses."
          : "See the real cost of homeownership: total interest, sunk costs, and inflation-adjusted equity you actually build."}
        icon={<Icon />}
        badge={isInvestment ? "Investment Property" : "Primary Residence"}
        breadcrumb="Real Estate"
      />
      <div className="container mx-auto px-4 py-8">

        {/* Mode toggle */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
            <button
              onClick={() => setMode("investment")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${isInvestment ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
            >
              Investment Property
            </button>
            <button
              onClick={() => setMode("primary")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${!isInvestment ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
            >
              Primary Residence
            </button>
          </div>
        </div>

        {/* KPI strip */}
        {(() => {
          const kpis = isInvestment ? [
            { label: `Real Value (yr ${years})`, value: `$${finalData.realValue.toLocaleString()}`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
            { label: "Real Equity", value: `$${finalData.realEquity.toLocaleString()}`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
            { label: "True ROI (all-in)", value: `${trueROI.toFixed(1)}%`, color: trueROI >= 0 ? "text-emerald-700" : "text-red-600", bg: "bg-white" },
            { label: "Cash-on-Cash Return", value: `${cashOnCash.toFixed(2)}%`, color: cashOnCash >= 0 ? "text-emerald-700" : "text-red-600", bg: "bg-white" },
          ] : [
            { label: `Real Value (yr ${years})`, value: `$${finalData.realValue.toLocaleString()}`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
            { label: "Real Equity", value: `$${finalData.realEquity.toLocaleString()}`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
            { label: "Total Sunk Cost", value: `$${Math.round(sunkCost).toLocaleString()}`, color: "text-red-600", bg: "bg-red-50 border-red-100" },
            { label: "Net Gain / Loss", value: `${netGain >= 0 ? "+" : ""}$${Math.round(netGain).toLocaleString()}`, color: netGain >= 0 ? "text-emerald-700" : "text-red-600", bg: "bg-white" },
          ];
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {kpis.map(k => (
                <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
                  <div className="text-xs text-slate-500 mb-1 font-medium">{k.label}</div>
                  <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base text-slate-800">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <Field label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" testId="input-price" />
              <Field label="Down Payment (%)" value={downPayment} onChange={setDownPayment} step={0.5} testId="input-down" />
              <Field label="Mortgage Rate (%)" value={mortgageRate} onChange={setMortgageRate} step={0.1} testId="input-mortgage-rate" />
              <Field label="Loan Term (years)" value={loanTerm} onChange={setLoanTerm} testId="input-loan-term" />
              <Field label="Annual Appreciation (%)" value={appreciation} onChange={setAppreciation} step={0.1} testId="input-appreciation" />
              {isInvestment && (
                <Field label="Annual Rental Income" value={annualRentalIncome} onChange={setAnnualRentalIncome} prefix="$" testId="input-rental" />
              )}
              <Field label={isInvestment ? "Annual Expenses" : "Annual Expenses (taxes, insurance, maintenance)"} value={annualExpenses} onChange={setAnnualExpenses} prefix="$" testId="input-expenses" />
              <Field label="Inflation Rate (%)" value={inflationRate} onChange={setInflationRate} step={0.1} testId="input-inflation" />
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium text-slate-700">Hold Period</Label>
                  <span className="text-sm font-bold text-blue-600">{years} yr</span>
                </div>
                <input type="range" min={1} max={loanTerm} value={years} onChange={e => setYears(Number(e.target.value))} data-testid="slider-years" className="w-full accent-blue-600 h-1.5" />
              </div>

              {/* Cost breakdown */}
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between"><span>Monthly Payment</span><span className="font-medium text-slate-600">${Math.round(monthlyPayment).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Total Mortgage Paid ({years}yr)</span><span className="font-medium text-slate-600">${Math.round(totalMortgagePayments).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Interest Paid (sunk)</span><span className="font-medium text-red-500">${Math.round(totalInterestPaid).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Expenses Paid (sunk)</span><span className="font-medium text-red-500">${Math.round(totalExpenses).toLocaleString()}</span></div>

                {isInvestment ? (
                  <>
                    <div className="flex justify-between"><span>Rental Income Collected</span><span className="font-medium text-emerald-600">+${Math.round(totalRentalIncome).toLocaleString()}</span></div>
                    <div className="flex justify-between font-semibold border-t border-slate-100 pt-1"><span>Total Cash Out</span><span className="text-red-600">${Math.round(invTotalCashOut).toLocaleString()}</span></div>
                    <div className="flex justify-between font-semibold"><span>Total Cash In</span><span className="text-emerald-600">${Math.round(invTotalCashIn).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>True ROI ({years}yr)</span><span className={`font-semibold ${trueROI >= 0 ? "text-emerald-600" : "text-red-500"}`}>{trueROI.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Cap Rate</span><span className="font-medium text-slate-600">{capRate.toFixed(2)}%</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between font-semibold border-t border-slate-100 pt-1"><span>Total Sunk Cost</span><span className="text-red-600">${Math.round(sunkCost).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Real Equity Built</span><span className="font-medium text-emerald-600">${finalData.realEquity.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Equity Gain vs Down Pmt</span><span className={`font-medium ${equityGain >= 0 ? "text-emerald-600" : "text-red-500"}`}>{equityGain >= 0 ? "+" : ""}${Math.round(equityGain).toLocaleString()}</span></div>
                    <div className="flex justify-between font-semibold border-t border-slate-100 pt-1"><span>Net Gain / Loss</span><span className={netGain >= 0 ? "text-emerald-600" : "text-red-500"}>{netGain >= 0 ? "+" : ""}${Math.round(netGain).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Avg Housing Cost / yr</span><span className="font-medium text-slate-600">${annualHousingCost.toLocaleString()}</span></div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-800">Nominal vs Real Value & Equity Over {years} Years</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="nomRE" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/><stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="realRE" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="eqRE" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} formatter={v => `$${Number(v).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                      <Area type="monotone" dataKey="nominalValue" name="Nominal Value" stroke="#94a3b8" strokeWidth={1.5} fill="url(#nomRE)" />
                      <Area type="monotone" dataKey="realValue" name="Real Value (today's $)" stroke="#3b82f6" strokeWidth={2} fill="url(#realRE)" />
                      <Area type="monotone" dataKey="realEquity" name="Real Equity" stroke="#10b981" strokeWidth={2} fill="url(#eqRE)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                  {isInvestment ? (
                    <>
                      After {years} years, real equity: <strong>${finalData.realEquity.toLocaleString()}</strong> + rental income: <strong className="text-emerald-700">${Math.round(totalRentalIncome).toLocaleString()}</strong>. Total cash out: <strong className="text-red-600">${Math.round(invTotalCashOut).toLocaleString()}</strong> — a true all-in ROI of <strong className={trueROI >= 0 ? "text-emerald-700" : "text-red-600"}>{trueROI.toFixed(1)}%</strong>.
                    </>
                  ) : (
                    <>
                      After {years} years, real equity: <strong>${finalData.realEquity.toLocaleString()}</strong>. Sunk costs (interest + expenses you won't recover): <strong className="text-red-600">${Math.round(sunkCost).toLocaleString()}</strong>, averaging <strong>${annualHousingCost.toLocaleString()}/yr</strong>. Net gain vs total cost: <strong className={netGain >= 0 ? "text-emerald-700" : "text-red-600"}>{netGain >= 0 ? "+" : ""}${Math.round(netGain).toLocaleString()}</strong>.
                    </>
                  )}
                </div>
                <AIInsight
                  calculator={isInvestment ? "Real Estate Investment Property" : "Real Estate Primary Residence"}
                  data={[
                    { label: "Purchase Price", value: `$${purchasePrice.toLocaleString()}` },
                    { label: "Down Payment", value: `${downPayment}% ($${Math.round(downPaymentAmount).toLocaleString()})` },
                    { label: "Mortgage Rate", value: `${mortgageRate}%` },
                    { label: "Loan Term", value: `${loanTerm} years` },
                    { label: "Hold Period", value: `${years} years` },
                    { label: "Annual Appreciation", value: `${appreciation}%` },
                    { label: "Inflation Rate", value: `${inflationRate}%` },
                    { label: "Monthly Payment", value: `$${Math.round(monthlyPayment).toLocaleString()}` },
                    { label: "Real Value at Sale", value: `$${finalData.realValue.toLocaleString()}` },
                    { label: "Real Equity", value: `$${finalData.realEquity.toLocaleString()}` },
                    { label: "Total Interest Paid", value: `$${Math.round(totalInterestPaid).toLocaleString()}` },
                    ...(isInvestment ? [
                      { label: "Annual Rental Income", value: `$${annualRentalIncome.toLocaleString()}` },
                      { label: "Annual Expenses", value: `$${annualExpenses.toLocaleString()}` },
                      { label: "True All-in ROI", value: `${trueROI.toFixed(1)}%` },
                      { label: "Cash-on-Cash Return", value: `${cashOnCash.toFixed(2)}%` },
                    ] : [
                      { label: "Annual Expenses (taxes, insurance, maintenance)", value: `$${annualExpenses.toLocaleString()}` },
                      { label: "Total Sunk Cost", value: `$${Math.round(sunkCost).toLocaleString()}` },
                      { label: "Avg Annual Housing Cost", value: `$${annualHousingCost.toLocaleString()}` },
                      { label: "Net Gain/Loss", value: `${netGain >= 0 ? "+" : ""}$${Math.round(netGain).toLocaleString()}` },
                    ]),
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
