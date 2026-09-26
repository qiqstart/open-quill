import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NIB_ANGLE, liveFountainSegments, liveFountainWidth, nibStamp, travelWidth, walkStamps } from "./calligraphy.ts";
import type { Point } from "./types.ts";

describe("fountain nib", () => {
  it("holds a slanted nib, longer than it is wide", () => {
    const stamp = nibStamp(3, 0.7, 1);
    assert.ok(stamp.rx > stamp.ry * 2.5);
    assert.ok(Math.abs(stamp.angle - NIB_ANGLE) < 0.001);
    assert.ok(NIB_ANGLE < 0);
  });

  it("writes thicker across the nib than along it (calligraphy)", () => {
    const along = travelWidth(Math.cos(NIB_ANGLE), Math.sin(NIB_ANGLE), 3);
    const across = travelWidth(-Math.sin(NIB_ANGLE), Math.cos(NIB_ANGLE), 3);
    assert.ok(across > along * 2);
  });

  it("scales the stamp with nib size", () => {
    assert.ok(nibStamp(5, 0.7, 1).rx > nibStamp(1, 0.7, 1).rx);
  });

  it("keeps the live ribbon thick across the nib and thin along it", () => {
    const along = liveFountainWidth(Math.cos(NIB_ANGLE), Math.sin(NIB_ANGLE), 3, 0.6, 1, NIB_ANGLE);
    const across = liveFountainWidth(-Math.sin(NIB_ANGLE), Math.cos(NIB_ANGLE), 3, 0.6, 1, NIB_ANGLE);
    assert.ok(across > along * 2);
  });

  it("walks overlapping stamps along a committed line", () => {
    const line: Point[] = [
      [0, 0, 0.55, 0],
      [40, 4, 0.55, 80],
    ];
    const n = walkStamps(line, 0.9, 3, NIB_ANGLE, () => {});
    assert.ok(n > 8);
  });

  it("keeps a live tail much smaller than the whole fountain line", () => {
    const line: Point[] = [];
    for (let i = 0; i <= 80; i++) line.push([i * 6, Math.sin(i / 4) * 12, 0.6, i * 16]);
    const whole = liveFountainSegments(line, 0.9, 3);
    const tail = liveFountainSegments(line.slice(-2), 0.9, 3);
    assert.ok(whole > 40);
    assert.ok(tail > 0);
    assert.ok(tail < whole / 8);
  });
});
