import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

router.post("/ai-insight", async (req, res) => {
  const { calculator, data } = req.body as {
    calculator: string;
    data: { label: string; value: string }[];
  };

  if (!calculator || !Array.isArray(data) || data.length === 0) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const key = process.env["GEMINI_API_KEY"];
  if (!key) {
    res.status(503).json({ error: "AI not configured" });
    return;
  }

  const dataStr = data
    .map((d) => `  ${d.label}: ${d.value}`)
    .join("\n");

  const prompt = `You are a sharp, concise financial analyst for InflationCalc.app. A user has entered their data into the ${calculator} calculator. Write a 3–4 sentence personalized insight in plain English. Cover: (1) what the key result means in practical terms, (2) any pattern or risk worth flagging, (3) one concrete consideration the user may not have thought of. Be specific — reference the actual numbers. Do NOT give explicit investment advice or tell users what to buy/sell. End with exactly this line on a new line: "⚠️ For educational purposes only. Not financial advice."

Calculator: ${calculator}
Data:
${dataStr}

Write only the insight text. No headers, no bullet points, no markdown.`;

  try {
    for (const model of MODELS) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
          }),
        }
      );
      if (!r.ok) continue;
      const json = (await r.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        res.json({ insight: text });
        return;
      }
    }
    res.status(503).json({ error: "AI unavailable — try again shortly" });
  } catch (err) {
    logger.error({ err }, "ai-insight error");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
