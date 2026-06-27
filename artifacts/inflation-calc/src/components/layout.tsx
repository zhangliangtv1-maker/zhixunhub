import { Link, useLocation } from "wouter";
import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Home" },
    { href: "/compound", label: "Compound Interest" },
    { href: "/purchasing-power", label: "Purchasing Power" },
    { href: "/fire", label: "FIRE" },
    { href: "/college", label: "College Savings" },
    { href: "/real-estate", label: "Real Estate" },
    { href: "/real-return", label: "Real Return" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
            InflationCalc
          </Link>
          <nav className="hidden lg:flex gap-1 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  location === link.href
                    ? "text-blue-600 bg-blue-50 font-semibold"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {/* Mobile menu hint */}
          <div className="flex lg:hidden gap-3 text-sm text-slate-500">
            <Link href="/compound" className="hover:text-blue-600">Compound</Link>
            <Link href="/fire" className="hover:text-blue-600">FIRE</Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t bg-slate-900 text-slate-400 py-10 mt-0">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </span>
                <span className="text-white font-bold">InflationCalc</span>
              </div>
              <p className="text-sm leading-relaxed">Precision financial calculators that factor in inflation — giving you the honest picture of your wealth over time.</p>
            </div>
            <div>
              <div className="text-white font-semibold mb-3 text-sm">Data Sources</div>
              <div className="space-y-2 text-sm">
                <a href="https://www.bls.gov/cpi/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  US BLS — CPI Data (1960–2024)
                </a>
                <a href="https://www.federalreserve.gov/releases/h15/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Federal Reserve — Interest Rates
                </a>
                <a href="https://www.ssa.gov/oact/cola/colaseries.html" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  SSA — COLA History
                </a>
                <a href="https://fred.stlouisfed.org/series/CPIAUCSL" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  FRED — CPI-U Series
                </a>
              </div>
              <div className="mt-5">
                <div className="text-white font-semibold mb-3 text-sm">Formulas Used</div>
                <div className="space-y-1 text-xs text-slate-500 font-mono">
                  <div>Compound: FV = PV(1+r)ⁿ</div>
                  <div>Real Return: Fisher Equation</div>
                  <div>FIRE: 4% Safe Withdrawal Rule</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-3 text-sm">About InflationCalc</div>
              <p className="text-sm leading-relaxed">All calculations are based on standard financial formulas and publicly available US BLS CPI data. Results are for educational and planning purposes only — not financial advice.</p>
              <div className="mt-5 space-y-3 text-sm text-slate-400">
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-blue-400"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>6 free, no-login calculators</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-blue-400"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>All calculations run in your browser — no data sent to servers</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-blue-400"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>CPI data: 1960–2025 (US BLS); 2026 partial-year estimate</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-500">
            <span>InflationCalc &copy; {new Date().getFullYear()} — Not financial advice. All results are estimates for educational use only.</span>
            <Link href="/legal" className="hover:text-slate-300 underline underline-offset-2 transition-colors whitespace-nowrap">
              Disclaimer &amp; Legal Notice
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
