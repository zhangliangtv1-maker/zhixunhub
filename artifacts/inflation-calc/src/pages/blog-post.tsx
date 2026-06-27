import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { Layout } from "@/components/layout";
import { setPageMeta } from "@/lib/seo";
import { getArticle, blogArticles } from "@/lib/blog-data";
import NotFound from "@/pages/not-found";

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const article = getArticle(slug);

  useEffect(() => {
    if (!article) return;
    setPageMeta({
      title: `${article.title} | InflationCalc`,
      description: article.description,
      path: `/blog/${article.slug}`,
    });
  }, [article]);

  if (!article) return <NotFound />;

  const currentIndex = blogArticles.findIndex((a) => a.slug === slug);
  const prev = currentIndex > 0 ? blogArticles[currentIndex - 1] : null;
  const next = currentIndex < blogArticles.length - 1 ? blogArticles[currentIndex + 1] : null;

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white text-sm mb-6 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            All Articles
          </Link>
          <div className="flex items-center gap-3 text-xs text-blue-300 mb-4">
            <span>{article.date}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{article.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-10">
        {/* CTA Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-0.5">Try it yourself</p>
            <p className="text-sm text-blue-700">{article.calcLabel} — free, instant, no login</p>
          </div>
          <Link
            href={article.calcLink}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Open Calculator →
          </Link>
        </div>

        {/* Article Content */}
        <div
          className="prose prose-slate prose-lg max-w-none
            prose-h2:text-2xl prose-h2:font-bold prose-h2:text-slate-900 prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:font-semibold prose-h3:text-slate-800 prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:my-4 prose-li:text-slate-700 prose-li:my-1
            prose-strong:text-slate-900
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-blue-700"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-7 text-white text-center">
          <p className="text-lg font-bold mb-2">Ready to run the numbers?</p>
          <p className="text-blue-100 text-sm mb-5">Use our free {article.calcLabel} — no account needed.</p>
          <Link
            href={article.calcLink}
            className="inline-block bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Open {article.calcLabel} →
          </Link>
        </div>

        {/* Prev / Next */}
        {(prev || next) && (
          <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prev && (
              <Link href={`/blog/${prev.slug}`} className="group block bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <p className="text-xs text-slate-500 mb-1">← Previous</p>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">{prev.title}</p>
              </Link>
            )}
            {next && (
              <Link href={`/blog/${next.slug}`} className="group block bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all sm:text-right">
                <p className="text-xs text-slate-500 mb-1">Next →</p>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">{next.title}</p>
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
