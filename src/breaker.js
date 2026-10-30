// Minimal closed/open/half-open illustration; not a hardened breaker.
export function createBreaker({threshold = 2, resetMs = 30_000, now = Date.now} = {}) {
  let failures = 0, openUntil = 0, probing = false;
  return {
    get state() { return openUntil && now() < openUntil ? 'open' : probing ? 'half-open' : failures >= threshold ? 'half-open' : 'closed'; },
    async run(operation) {
      if (openUntil && now() < openUntil) throw new Error('CIRCUIT_OPEN');
      if (failures >= threshold) {
        if (probing) throw new Error('CIRCUIT_OPEN');
        probing = true; // Allow only one recovery probe.
      }
      try {
        const result = await operation();
        failures = 0; openUntil = 0;
        return result;
      } catch (error) {
        failures++;
        if (failures >= threshold) openUntil = now() + resetMs;
        throw error;
      } finally { probing = false; }
    }
  };
}
