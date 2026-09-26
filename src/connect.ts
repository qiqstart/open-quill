/**
 * Keep a stroke looking like one curve when samples are sparse
 * (long lines, zoom). Used by live ribbons and the fountain nib.
 */
import type { Point } from "./types.ts";

/** Distance between neighbors, ignoring time/pressure. */
export function segmentLength(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** How far a fountain stamp can step and still overlap. */
export function stampStep(rx: number, ry: number): number {
  const thin = Math.min(Math.abs(rx), Math.abs(ry));
  return Math.max(0.28, thin * 0.72);
}

/**
 * Insert points so no neighbor is farther than maxGap.
 * Pressure and dt lerp with position.
 */
export function fillGaps(pts: Point[], maxGap: number): Point[] {
  if (pts.length < 2 || !(maxGap > 0)) return pts;
  const out: Point[] = [pts[0]!];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const dist = segmentLength(a, b);
    const n = Math.max(1, Math.ceil(dist / maxGap));
    for (let k = 1; k < n; k++) {
      const t = k / n;
      out.push([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t,
      ]);
    }
    out.push(b);
  }
  return out;
}

/** Gap for a live ribbon: short enough that round caps overlap. */
export function ribbonGap(lineWidth: number): number {
  return Math.max(0.4, lineWidth * 0.65);
}
