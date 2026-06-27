import { useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { setPageMeta } from "@/lib/seo";
import { blogArticles } from "@/lib/blog-data";

export function Blog() {
  useEffect(() => {
    setPageMeta({
      title: "Inflation & Personal Finance Blog | InflationCalc",
      description: "Practical guides on inflation, compound interest, FIRE retirement, college savings, real estate ROI, and purchasing power — with free calculators.",
      path: "/blog",
    });
  }, []);

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white py-14">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-3">Blog</p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">Inflation & Personal Finance Guides</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Practical explanations of how inflation affects your investments, retirement, home, and savings — paired with free calculators.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="grid gap-6">
          {blogArticles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`}>
              <article className="group bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
                  {article.title}
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{article.description}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    {article.calcLabel}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
