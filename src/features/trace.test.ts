import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Point } from "../types.ts";
import { tipOf, traceAt } from "./trace.ts";

const line: Point[] = [
  [0, 0, 0.5, 0],
  [100, 0, 0.5, 100],
  [100, 50, 0.5, 200],
];

describe("playback trace", () => {
  it("grows along the line instead of waiting for the whole stroke", () => {
    assert.deepEqual(traceAt(line, -1), []);
    assert.equal(traceAt(line, 0).length, 1);

    const mid = traceAt(line, 50);
    assert.equal(mid.length, 2);
    assert.equal(mid[0]![0], 0);
    assert.ok(Math.abs(mid[1]![0] - 50) < 0.01);
    assert.ok(Math.abs(mid[1]![1]) < 0.01);

    const corner = traceAt(line, 150);
    assert.equal(corner.length, 3);
    assert.ok(Math.abs(corner[2]![0] - 100) < 0.01);
    assert.ok(Math.abs(corner[2]![1] - 25) < 0.01);

    const done = traceAt(line, 200);
    assert.equal(done.length, 3);
    assert.equal(done[2]![1], 50);
  });

  it("reads the nib tip from the last point", () => {
    const mid = traceAt(line, 50);
    const tip = tipOf(mid);
    assert.ok(tip);
    assert.ok(Math.abs(tip!.x - 50) < 0.01);
    assert.equal(tipOf([]), null);
  });
});
