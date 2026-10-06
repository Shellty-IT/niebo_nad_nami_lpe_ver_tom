// Zegar domenowy nie korzysta z DOM ani liczby wyrenderowanych klatek.
export class SimulationClock {
  private epochMs = 0;
  private anchorMs = 0;
  private rate = 0;
  set(instantMs: number, rate: number, monotonicMs: number) {
    if (![instantMs, rate, monotonicMs].every(Number.isFinite)) throw new Error('invalid-clock');
    this.epochMs = instantMs; this.rate = rate; this.anchorMs = monotonicMs;
  }
  sample(monotonicMs: number): number {
    return this.epochMs + Math.max(0, monotonicMs - this.anchorMs) * this.rate;
  }
}
