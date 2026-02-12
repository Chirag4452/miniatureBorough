export function getUtcDateString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & 0xffffffff;
  }
  return h >>> 0;
}

export function createSeededRng(seed: number): () => number {
  return function next() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDailyRng(): () => number {
  const date_str = getUtcDateString();
  const seed = hashString(date_str);
  return createSeededRng(seed);
}
