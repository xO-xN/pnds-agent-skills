export const DURATION_MS = 12000;
export function positionAt(start, now) {
  return Math.max(0, Math.min(1, (now - start) / DURATION_MS));
}
