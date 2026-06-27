import { useState } from "react";

interface AIInsightProps {
  calculator: string;
  data: { label: string; value: string }[];
}

export function AIInsight({ calculator, data }: AIInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsight() {
    setLoading(true);
    setError(null);
    setInsight(null);
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calculator, data }),
      });
      const json = await res.json() as { insight?: string; error?: string };
      if (json.insight) setInsight(json.insight);
      else setError(json.error ?? "Could not generate insight. Please try again.");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const disclaimer = "⚠️ For educational purposes only. Not financial advice.";

  const mainText = insight
    ? insight.replace(disclaimer, "").replace("⚠️ For educational purposes only. Not financial advice.", "").trim()
    : null;

  return (
    <div className="mt-4">
      {!insight && !loading && (
        <button
          onClick={fetchInsight}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          <span>✨</span>
          <span>Get AI Insight</span>
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <svg className="animate-spin h-4 w-4 text-blue-600 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Analyzing your data with AI…
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          {error}
          <button onClick={fetchInsight} className="ml-2 underline font-medium">Retry</button>
        </div>
      )}

      {insight && (
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
              <span>✨</span>
              <span>AI Insight</span>
            </div>
            <button
              onClick={fetchInsight}
              className="text-xs text-indigo-500 hover:text-indigo-700 underline transition-colors"
            >
              Refresh
            </button>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{mainText}</p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
            {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
