import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPlayback, visibleAt } from "./playback.ts";
import type { Stroke } from "./types.ts";

function stroke(id: string, t0: number, pts: Stroke["pts"], kind: Stroke["kind"] = "stroke"): Stroke {
  return { id, t0, ink: 1, kind, pts };
}

describe("playback", () => {
  it("replays a scribble along its path, not all at once", () => {
    const s = stroke("a", 0, [
      [0, 0, 0.5, 0],
      [80, 0, 0.5, 80],
    ]);
    const { slices, duration } = buildPlayback([s]);
    assert.ok(duration > 80);

    const start = visibleAt(slices, 0);
    assert.equal(start.done.length, 0);
    assert.ok(start.partial);
    assert.equal(start.partial!.pts.length, 1);

    const mid = visibleAt(slices, 40);
    assert.equal(mid.done.length, 0);
    assert.equal(mid.partial!.pts.length, 2);
    assert.ok(Math.abs(mid.partial!.pts[1]![0] - 40) < 0.01);

    const end = visibleAt(slices, 80);
    assert.equal(end.done.length, 1);
    assert.equal(end.partial, null);
  });

  it("drops blots as whole marks, not traced outlines", () => {
    const blot = stroke("b", 10, [[4, 4, 1, 0], [6, 5, 1, 12]], "drip");
    const { slices } = buildPlayback([blot]);
    const vis = visibleAt(slices, 1);
    assert.equal(vis.done.length, 1);
    assert.equal(vis.partial, null);
  });
});
