import type { Point } from "../types";

/**
 * Replay a recorded stroke as a growing line.
 * Points store dt from the start of the stroke; this walks that clock and
 * interpolates along the current segment so the hand does not jump.
 */
export function traceAt(pts: Point[], localMs: number): Point[] {
  if (pts.length === 0 || localMs < 0) return [];
  const first = pts[0]!;
  if (localMs < first[3]) return [];

  const out: Point[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    if (p[3] < localMs) {
      out.push(p);
      continue;
    }
    if (p[3] === localMs) {
      out.push(p);
      break;
    }
    const prev = pts[i - 1];
    if (!prev) return [];
    const span = p[3] - prev[3];
    const t = span <= 0 ? 1 : (localMs - prev[3]) / span;
    out.push([
      prev[0] + (p[0] - prev[0]) * t,
      prev[1] + (p[1] - prev[1]) * t,
      prev[2] + (p[2] - prev[2]) * t,
      localMs,
    ]);
    break;
  }
  return out;
}

export function tipOf(pts: Point[]): { x: number; y: number } | null {
  if (pts.length === 0) return null;
  const p = pts[pts.length - 1]!;
  return { x: p[0], y: p[1] };
}
