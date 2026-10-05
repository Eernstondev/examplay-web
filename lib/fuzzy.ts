// Comparaison tolérante des réponses courtes : copie de l'app mobile (lib/fuzzyMatch.ts).
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - levenshtein(a, b) / maxLen;
}

export function isAnswerClose(userInput: string, correctAnswer: string, threshold = 0.75): boolean {
  const u = normalize(userInput);
  const c = normalize(correctAnswer);
  if (!u) return false;
  if (u === c) return true;

  const correctWords = c.split(" ").filter((w) => w.length > 2);
  if (correctWords.length <= 2) return similarity(u, c) >= threshold;

  const userWords = u.split(" ");
  const found = correctWords.filter((cw) =>
    userWords.some((uw) => similarity(uw, cw) >= threshold),
  ).length;
  return found / correctWords.length >= 0.6;
}
