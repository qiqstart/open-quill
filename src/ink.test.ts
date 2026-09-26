import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dripChance, inkAppearance, liveSendMs, minLiveStep, nibSize, shouldBleed } from "./ink.ts";
import { colorById } from "./settings.ts";

describe("splotch", () => {
  it("makes no drips when splotch is off", () => {
    assert.equal(dripChance(1, 10, true, 0), 0);
  });

  it("scales drip chance with splotch", () => {
    const low = dripChance(0.95, 10, true, 0.2);
    const high = dripChance(0.95, 10, true, 1);
    assert.ok(high > low);
    assert.ok(high > 0);
  });

  it("skips dwell bleed when splotch is near zero", () => {
    assert.equal(shouldBleed(0, 800, 0.5), false);
    assert.equal(shouldBleed(0.5, 800, 0.5), true);
    assert.equal(shouldBleed(0.5, 100, 0.5), false);
  });
});

describe("nib size", () => {
  it("offers five steps, hairline thinner than broad", () => {
    const hair = nibSize(1, 0.5, "pen", 1);
    const mid = nibSize(1, 0.5, "pen", 3);
    const broad = nibSize(1, 0.5, "pen", 5);
    assert.ok(hair < mid);
    assert.ok(mid < broad);
    assert.ok(broad / hair > 2);
  });
});

describe("long live lines", () => {
  it("spaces samples farther apart as the line grows", () => {
    assert.equal(minLiveStep(10), 0.55);
    assert.ok(minLiveStep(100) > minLiveStep(10));
    assert.ok(minLiveStep(200) > minLiveStep(100));
    assert.ok(minLiveStep(400) > minLiveStep(200));
    assert.ok(liveSendMs(300) > liveSendMs(10));
  });
});

describe("ink appearance", () => {
  it("uses per-color body so faded iron stays darker than the old pale wash", () => {
    const aged = inkAppearance(3 * 60_000, colorById("iron"));
    assert.ok(aged.alpha > 0.72);
    const forest = inkAppearance(3 * 60_000, colorById("forest"));
    assert.ok(aged.alpha > forest.alpha);
  });
});
