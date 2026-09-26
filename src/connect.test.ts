import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Point } from "./types.ts";
import { fillGaps, ribbonGap, segmentLength, stampStep } from "./connect.ts";
import { nibStamp } from "./calligraphy.ts";

describe("continual stroke", () => {
  it("inserts points so neighbors stay within the gap", () => {
    const line: Point[] = [
      [0, 0, 0.4, 0],
      [100, 0, 0.8, 100],
    ];
    const filled = fillGaps(line, 10);
    assert.equal(filled[0]![0], 0);
    assert.equal(filled[filled.length - 1]![0], 100);
    assert.ok(filled.length >= 11);
    for (let i = 1; i < filled.length; i++) {
      assert.ok(segmentLength(filled[i - 1]!, filled[i]!) <= 10 + 1e-6);
    }
    const mid = filled[Math.floor(filled.length / 2)]!;
    assert.ok(Math.abs(mid[2] - 0.6) < 0.08);
  });

  it("leaves a short segment alone", () => {
    const pts: Point[] = [
      [0, 0, 0.5, 0],
      [1, 0, 0.5, 10],
    ];
    assert.equal(fillGaps(pts, 10).length, 2);
  });

  it("keeps fountain stamps overlapping, even on a thin nib", () => {
    const s = nibStamp(3, 0.5, 1);
    const step = stampStep(s.rx, s.ry);
    assert.ok(step < 2 * Math.min(s.rx, s.ry));
    const dry = nibStamp(3, 0.5, 0.2);
    assert.ok(stampStep(dry.rx, dry.ry) <= stampStep(s.rx, s.ry));
  });

  it("sizes the live ribbon gap so round caps can meet", () => {
    const width = 2.4;
    assert.ok(ribbonGap(width) < width);
    assert.ok(ribbonGap(width) > 0);
  });
});


