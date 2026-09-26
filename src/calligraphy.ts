import { fillGaps, stampStep } from "./connect.ts";
import type { Point } from "./types.ts";

export const NIB_ANGLE = -Math.PI / 5;

export function nibStamp(size: number, pressure: number, ink: number, angle = NIB_ANGLE) {
  const rx = (0.85 + size * 0.9) * (0.42 + pressure * 0.75) * (0.28 + ink * 0.72);
  const ry = rx * 0.18;
  return { rx, ry, angle };
}

export function travelWidth(dx: number, dy: number, size: number): number {
  const travel = Math.atan2(dy, dx);
  const contrast = Math.abs(Math.sin(travel - NIB_ANGLE));
  const base = 0.45 + size * 0.55;
  return base * (0.22 + contrast * 1.15);
}

/** Live ribbon width: thick across the nib, thin along it. */
export function liveFountainWidth(
  dx: number,
  dy: number,
  size: number,
  pressure: number,
  ink: number,
  angle: number,
): number {
  const s = nibStamp(size, pressure, ink, angle);
  const travel = Math.atan2(dy, dx);
  const contrast = Math.abs(Math.sin(travel - angle));
  return 2 * (s.ry + (s.rx - s.ry) * contrast);
}

function stampAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  angle: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.4, rx), Math.max(0.2, ry), angle, 0, Math.PI * 2);
  ctx.fill();
}

export function walkStamps(
  pts: Point[],
  ink: number,
  size: number,
  angle: number,
  visit: (x: number, y: number, rx: number, ry: number, a: number) => void,
): number {
  if (pts.length === 0) return 0;
  let n = 0;
  const stamp = (x: number, y: number, p: number) => {
    const s = nibStamp(size, p, ink, angle);
    visit(x, y, s.rx, s.ry, s.angle);
    n += 1;
    return s;
  };
  if (pts.length === 1) {
    const [x, y, p] = pts[0]!;
    stamp(x, y, p);
    return n;
  }
  for (let i = 0; i < pts.length; i++) {
    const [x, y, p] = pts[i]!;
    const s = stamp(x, y, p);
    if (i === 0) continue;
    const [x0, y0, p0] = pts[i - 1]!;
    const prev = nibStamp(size, p0, ink, angle);
    const gap = Math.min(stampStep(s.rx, s.ry), stampStep(prev.rx, prev.ry));
    const dist = Math.hypot(x - x0, y - y0);
    const steps = Math.max(1, Math.ceil(dist / gap));
    for (let k = 1; k < steps; k++) {
      const t = k / steps;
      stamp(x0 + (x - x0) * t, y0 + (y - y0) * t, p0 + (p - p0) * t);
    }
  }
  return n;
}

/** How many live strokes a fountain ribbon would issue. Tail slices stay small. */
export function liveFountainSegments(pts: Point[], ink: number, size: number): number {
  if (pts.length < 2) return 0;
  const typical = nibStamp(size, pts[pts.length - 1]![2], ink);
  return Math.max(0, fillGaps(pts, Math.max(1, typical.ry * 2.2)).length - 1);
}

/** Saved stroke: overlapping nib stamps. Once per stroke, not every move. */
export function drawCalligraphy(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  ink: number,
  size: number,
  angle = NIB_ANGLE,
) {
  walkStamps(pts, ink, size, angle, (x, y, rx, ry, a) => {
    stampAt(ctx, x, y, rx, ry, a);
  });
}

/**
 * Live fountain: a cheap variable-width ribbon with the same thick/thin
 * as the nib, so long lines stay with the pencil.
 */
export function drawLiveFountain(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  ink: number,
  size: number,
  angle = NIB_ANGLE,
) {
  if (pts.length === 0) return;
  if (pts.length === 1) {
    const [x, y, p] = pts[0]!;
    const s = nibStamp(size, p, ink, angle);
    stampAt(ctx, x, y, s.rx, s.ry, s.angle);
    return;
  }
  const typical = nibStamp(size, pts[pts.length - 1]![2], ink, angle);
  const filled = fillGaps(pts, Math.max(1, typical.ry * 2.2));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 1; i < filled.length; i++) {
    const a = filled[i - 1]!;
    const b = filled[i]!;
    ctx.lineWidth = Math.max(0.7, liveFountainWidth(b[0] - a[0], b[1] - a[1], size, b[2], ink, angle));
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
}
