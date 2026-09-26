import type { Stroke } from "./types";

export const MAX_PAGES = 24;

export function pageOf(stroke: Pick<Stroke, "page">): number {
  const n = stroke.page;
  if (typeof n !== "number" || !Number.isFinite(n)) return 1;
  return Math.min(MAX_PAGES, Math.max(1, Math.round(n)));
}

export function samePage(markPage: number | undefined, viewerPage: number): boolean {
  return pageOf({ page: markPage }) === viewerPage;
}

export function strokesOnPage(strokes: Stroke[], page: number): Stroke[] {
  return strokes.filter((s) => pageOf(s) === page);
}

export function pageCount(strokes: Stroke[], held = 1): number {
  let max = Math.max(1, held);
  for (const s of strokes) max = Math.max(max, pageOf(s));
  return Math.min(MAX_PAGES, max);
}
