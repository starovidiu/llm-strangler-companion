import {createHash} from 'node:crypto';
// Stable, deterministic cohort; use an actual feature-flag platform in production.
export function enabled(tenantId, percentage) {
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new RangeError('percentage must be 0..100');
  }
  const hash = createHash('sha256').update(String(tenantId)).digest();
  const bucket = hash.readUInt32BE(0) % 10_000;
  return bucket < percentage * 100;
}
