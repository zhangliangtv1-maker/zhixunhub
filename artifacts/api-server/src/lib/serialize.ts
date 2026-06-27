import type { Article, Comment } from "@workspace/db";

const WORDS_PER_MINUTE = 200;

function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calcReadingTime(article: Article): number {
  const words = countWords(article.summary) + countWords(article.content);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function calcHotScore(article: Article): number {
  const ageMs = Date.now() - article.createdAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 100 - ageHours * 2);
  const noise = (article.id * 37 + 13) % 26;
  return Math.min(100, Math.round(recencyScore * 0.75 + noise));
}

export function serializeArticle(a: Article, aiComment?: string | null) {
  return {
    id: a.id,
    title: a.title,
    source_url: a.sourceUrl ?? null,
    image_url: a.imageUrl ?? null,
    summary: a.summary ?? null,
    content: a.content ?? null,
    category: a.category ?? null,
    ai_comment: aiComment ?? null,
    share_text: a.shareText ?? null,
    created_at: a.createdAt.toISOString(),
    reading_time: calcReadingTime(a),
    hot_score: calcHotScore(a),
  };
}

export function serializeComment(c: Comment) {
  return {
    id: c.id,
    article_id: c.articleId,
    content: c.content,
    commenter_name: c.commenterName,
    created_at: c.createdAt.toISOString(),
  };
}
