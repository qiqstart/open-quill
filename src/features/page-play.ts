/**
 * Replay only the sheet you are looking at.
 * Turn the module off (features/flags `page-play`) to walk the whole letter.
 */
import { strokesOnPage } from "../pages.ts";
import type { Stroke } from "../types.ts";

/** Strokes the play clock should walk. */
export function playList(strokes: Stroke[], page: number, enabled = true): Stroke[] {
  return enabled ? strokesOnPage(strokes, page) : strokes;
}
