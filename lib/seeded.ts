// Tirages déterministes des duels : mêmes algorithmes que l'app mobile
// (data/questions.ts), pour que les deux joueurs reçoivent les mêmes questions.
export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function pickSeeded<T>(pool: T[], seed: number, n = 5): T[] {
  const list = [...pool];
  const r = seeded(seed);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, n);
}

// Ordre d'affichage des choix : order[position affichée] = index d'origine.
export function shuffledOrder(length: number, seed: number): number[] {
  const r = seeded(seed);
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function shuffle<T>(a: T[]): T[] {
  const l = [...a];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}
