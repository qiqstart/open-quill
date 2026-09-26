import { traceAt } from "./features/trace.ts";
import type { Point, Stroke } from "./types";

const GAP_KEEP = 1100;
const GAP_COMPRESS = 260;

type Slice = {
  stroke: Stroke;
  playAt: number;
};

export function buildPlayback(strokes: Stroke[]): {
  slices: Slice[];
  duration: number;
} {
  const sorted = [...strokes].sort((a, b) => a.t0 - b.t0 || a.id.localeCompare(b.id));
  const slices: Slice[] = [];
  let play = 0;
  let lastEnd = sorted[0]?.t0 ?? 0;
  for (const stroke of sorted) {
    const gap = stroke.t0 - lastEnd;
    play += gap > GAP_KEEP ? GAP_COMPRESS : Math.max(0, gap);
    slices.push({ stroke, playAt: play });
    const dur = stroke.pts.length ? stroke.pts[stroke.pts.length - 1]![3] : 0;
    lastEnd = stroke.t0 + dur;
  }
  const last = slices[slices.length - 1];
  const tail = last?.stroke.pts.length ? last.stroke.pts[last.stroke.pts.length - 1]![3] : 0;
  return { slices, duration: (last ? last.playAt + tail : 0) + 240 };
}

export function visibleAt(
  slices: Slice[],
  elapsed: number,
): { done: Stroke[]; partial: { stroke: Stroke; pts: Point[] } | null } {
  const done: Stroke[] = [];
  let partial: { stroke: Stroke; pts: Point[] } | null = null;
  for (const slice of slices) {
    const local = elapsed - slice.playAt;
    if (local < 0) break;
    const lastDt = slice.stroke.pts.length ? slice.stroke.pts[slice.stroke.pts.length - 1]![3] : 0;
    if (slice.stroke.kind !== "stroke") {
      done.push(slice.stroke);
      continue;
    }
    if (local >= lastDt) {
      done.push(slice.stroke);
    } else {
      const pts = traceAt(slice.stroke.pts, local);
      if (pts.length) partial = { stroke: slice.stroke, pts };
      break;
    }
  }
  return { done, partial };
}
