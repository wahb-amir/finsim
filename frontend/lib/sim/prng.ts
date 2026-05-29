export type RNG = {
  next: () => number; // [0, 1)
  int: (minInclusive: number, maxInclusive: number) => number;
  pick: <T>(arr: readonly T[]) => T;
};

// Mulberry32: small, fast, deterministic PRNG.
// https://stackoverflow.com/a/47593316 (public domain snippet widely used)
export function createRng(seed: number): RNG {
  let t = seed >>> 0;
  const next = () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(minInclusive, maxInclusive) {
      const min = Math.ceil(minInclusive);
      const max = Math.floor(maxInclusive);
      if (max < min) throw new Error("RNG.int: invalid range");
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(arr) {
      if (arr.length === 0) throw new Error("RNG.pick: empty array");
      return arr[Math.floor(next() * arr.length)];
    },
  };
}

export function hashSeed(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
