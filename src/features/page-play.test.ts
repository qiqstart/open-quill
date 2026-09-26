import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPlayback, visibleAt } from "../playback.ts";
import type { Stroke } from "../types.ts";
import { playList } from "./page-play.ts";

function stroke(id: string, page: number, t0 = 0, lastDt = 80): Stroke {
  return {
    id,
    t0,
    ink: 1,
    kind: "stroke",
    page,
    pts: [
      [0, 0, 0.5, 0],
      [40, 0, 0.5, lastDt],
    ],
  };
}

describe("page play", () => {
  it("keeps only the current sheet when the module is on", () => {
    const all = [stroke("a", 1), stroke("b", 2), stroke("c", 1)];
    assert.deepEqual(
      playList(all, 1, true).map((s) => s.id),
      ["a", "c"],
    );
    assert.deepEqual(
      playList(all, 2, true).map((s) => s.id),
      ["b"],
    );
  });

  it("walks the whole letter when the module is off", () => {
    const all = [stroke("a", 1), stroke("b", 2)];
    assert.deepEqual(
      playList(all, 1, false).map((s) => s.id),
      ["a", "b"],
    );
  });

  it("builds a clock that does not include other sheets", () => {
    const a = stroke("a", 1, 0, 100);
    const b = stroke("b", 2, 200, 400);
    const { duration: folio } = buildPlayback([a, b]);
    const { duration: page, slices } = buildPlayback(playList([a, b], 1, true));
    assert.ok(page < folio);
    assert.equal(slices.length, 1);
    assert.equal(slices[0]!.stroke.id, "a");

    const mid = visibleAt(slices, 50);
    assert.ok(mid.partial);
    assert.equal(mid.done.length, 0);
    const late = visibleAt(slices, 500);
    assert.equal(late.done.length, 1);
    assert.equal(late.done[0]!.id, "a");
    assert.equal(late.partial, null);
  });
});
