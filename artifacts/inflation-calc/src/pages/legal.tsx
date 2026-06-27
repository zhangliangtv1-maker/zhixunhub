import { useEffect } from "react";
import { Layout } from "@/components/layout";

export function Legal() {
  useEffect(() => {
    document.title = "Legal & Disclaimer | InflationCalc";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "InflationCalc disclaimer, terms of use, copyright notice, and privacy information.");
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = "May 2026";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Legal &amp; Disclaimer</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-10 text-slate-700 leading-relaxed">

          {/* Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">1. Disclaimer</h2>
            <p className="mb-3">
              The information and calculation results provided by <strong>InflationCalc</strong> (inflationcalc.com) are for <strong>educational and informational purposes only</strong>. Nothing on this website constitutes financial, investment, legal, or tax advice.
            </p>
            <p className="mb-3">
              All calculator outputs are mathematical projections based on user-provided inputs and publicly available historical data. They are estimates and <strong>do not guarantee future results</strong>. Actual investment returns, inflation rates, and financial outcomes may differ materially from any projections displayed.
            </p>
            <p>
              Financial markets involve risk, including possible loss of principal. Past performance is not indicative of future results. Users should consult a qualified financial advisor, accountant, or legal professional before making any financial, investment, or retirement planning decisions.
            </p>
          </section>

          {/* No Financial Advice */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">2. No Financial Advice</h2>
            <p className="mb-3">
              InflationCalc is not a registered investment advisor, broker-dealer, financial planner, or financial institution. We are not licensed or regulated by any financial regulatory authority. The calculators and content on this site do not constitute:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 mb-3 ml-2">
              <li>Investment advice or recommendations to buy, sell, or hold any security</li>
              <li>Retirement planning advice</li>
              <li>Tax or legal advice</li>
              <li>Insurance recommendations</li>
              <li>A solicitation of any investment product or service</li>
            </ul>
            <p>
              Always perform your own due diligence and seek independent professional advice appropriate to your specific financial situation and jurisdiction.
            </p>
          </section>

          {/* Data Sources & Accuracy */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">3. Data Sources &amp; Accuracy</h2>
            <p className="mb-3">
              Historical Consumer Price Index (CPI) data used in the Purchasing Power Calculator is sourced from the <strong>US Bureau of Labor Statistics (BLS)</strong>, a public agency of the United States federal government. CPI data is provided as-is for general reference and may not reflect regional or sector-specific inflation rates.
            </p>
            <p className="mb-3">
              All other calculations (compound interest, FIRE projections, real rate of return, real estate ROI, college savings) use standard financial mathematics formulas. These include:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 mb-3 ml-2">
              <li>Compound interest formula: FV = PV × (1 + r)ⁿ + PMT × ((1 + r)ⁿ − 1) / r</li>
              <li>Fisher equation: real rate = ((1 + nominal) ÷ (1 + inflation)) − 1</li>
              <li>Safe withdrawal rate: 4% rule (Bengen, 1994)</li>
              <li>FIRE number: 25× annual spending (based on 4% SWR)</li>
            </ul>
            <p>
              While we strive for accuracy, we make no warranties, express or implied, about the completeness, reliability, suitability, or availability of any information or calculations on this site. Any reliance you place on such information is strictly at your own risk.
            </p>
          </section>

          {/* Copyright */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">4. Copyright &amp; Intellectual Property</h2>
            <p className="mb-3">
              All content on InflationCalc — including text, design, graphics, user interface elements, and code — is the property of InflationCalc and is protected under applicable copyright laws.
            </p>
            <p className="mb-3">
              You may access and use the calculators for personal, non-commercial purposes. You may not:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 mb-3 ml-2">
              <li>Reproduce, duplicate, copy, sell, or exploit any portion of this site for commercial purposes without express written permission</li>
              <li>Scrape, crawl, or automatically collect data from this site</li>
              <li>Frame or mirror this site on any other server or device</li>
              <li>Remove or alter any copyright, trademark, or other proprietary notices</li>
            </ul>
            <p>
              US BLS CPI data is in the public domain as a US government work and is used in accordance with its public availability.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">5. Limitation of Liability</h2>
            <p className="mb-3">
              To the fullest extent permitted by applicable law, InflationCalc and its operators shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of, or reliance on, any content, information, or calculations provided on this website.
            </p>
            <p>
              This includes, without limitation, any financial loss, lost profit, loss of data, or other intangible losses, even if InflationCalc has been advised of the possibility of such damages.
            </p>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">6. Privacy</h2>
            <p className="mb-3">
              InflationCalc does not collect, store, or transmit any personal or financial information you enter into the calculators. All calculations are performed locally in your browser. We do not maintain any database of user inputs.
            </p>
            <p>
              This site may use standard analytics tools (such as page view tracking) that collect anonymized, aggregate data about site usage. No personally identifiable information is collected or sold to third parties.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">7. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable law. By using InflationCalc, you agree to submit to the jurisdiction of the applicable courts for the resolution of any disputes arising out of or related to these terms or your use of this site.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-200">8. Changes to This Notice</h2>
            <p>
              InflationCalc reserves the right to update or modify this disclaimer and legal notice at any time without prior notice. Changes are effective immediately upon posting. Continued use of the site constitutes your acceptance of any revised terms.
            </p>
          </section>

          {/* Footer note */}
          <div className="mt-10 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            If you have questions about this disclaimer or the use of our calculators, the underlying financial formulas, or data sources, you are welcome to review the publicly available references cited above (US BLS, Bengen 1994 SWR study, Fisher equation).
          </div>

        </div>
      </div>
    </Layout>
  );
}
