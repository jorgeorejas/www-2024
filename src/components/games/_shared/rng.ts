// Deterministic xorshift32 PRNG seeded from a string.
// Identical algorithm to the one previously inlined in solitaire/engine.ts.

export class PRNG {
  private state: number;

  constructor(seed: string) {
    this.state = PRNG.hashSeed(seed);
  }

  private static hashSeed(seed: string): number {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;
    this.state = this.state >>> 0;
    return this.state / 0x100000000;
  }

  randInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.randInt(items.length)];
  }

  shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randInt(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
