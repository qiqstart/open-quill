import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { INK_COLORS, colorById } from "../settings.ts";
import {
  DEFAULT_BODY,
  FADE_FLOOR,
  INK_BODY,
  appearanceAlpha,
  bodyFor,
  bodyMix,
  fadeAmount,
  fadeFloor,
  fadedLook,
  luminance,
} from "./fade.ts";

const WET_MS = 22_000;
const FADE_MS = 3 * 60_000;
const OLD_FLOOR = 0.52;

describe("fade feature", () => {
  it("gives every desk ink a body", () => {
    for (const c of INK_COLORS) {
      assert.ok(c.id in INK_BODY, c.id);
      assert.ok(INK_BODY[c.id]! > 0.5 && INK_BODY[c.id]! <= 1);
    }
    assert.equal(bodyFor(undefined), DEFAULT_BODY);
    assert.equal(bodyFor("nope"), DEFAULT_BODY);
  });

  it("keeps more film as body rises", () => {
    assert.ok(fadeFloor(0.9) > fadeFloor(0.7));
    assert.ok(bodyMix(0.9) > bodyMix(0.7));
    assert.ok(fadeFloor(1) < 1);
    assert.ok(fadeFloor(0) > OLD_FLOOR);
    assert.ok(FADE_FLOOR > OLD_FLOOR);
  });

  it("keeps the dry-down: wet color first, then dry, then a fainter fade", () => {
    const iron = colorById("iron");
    const fresh = fadedLook(0, iron, { wetMs: WET_MS, fadeMs: FADE_MS });
    const dried = fadedLook(WET_MS, iron, { wetMs: WET_MS, fadeMs: FADE_MS });
    const aged = fadedLook(FADE_MS, iron, { wetMs: WET_MS, fadeMs: FADE_MS });

    assert.equal(fresh.color.toLowerCase(), iron.wet.toLowerCase());
    assert.ok(fresh.alpha > 0.98);
    assert.ok(fresh.wet > 0.99);

    assert.ok(dried.wet < 0.02);
    const dryLum = luminance(iron.dry);
    const wetLum = luminance(iron.wet);
    const gotLum = luminance(dried.color);
    assert.ok(Math.abs(gotLum - dryLum) < Math.abs(gotLum - wetLum));
    assert.ok(Math.abs(gotLum - dryLum) < 12);
    assert.ok(dried.alpha > 0.85);

    assert.ok(aged.alpha < dried.alpha);
    assert.ok(luminance(aged.color) > luminance(dried.color));
  });

  it("leaves faded ink far less pale than the old 0.52 floor", () => {
    for (const c of INK_COLORS) {
      const aged = fadedLook(FADE_MS, c, { wetMs: WET_MS, fadeMs: FADE_MS });
      const oldAlpha = OLD_FLOOR * 0.86;
      assert.ok(aged.alpha > 0.72, `${c.id} alpha ${aged.alpha}`);
      assert.ok(aged.alpha > oldAlpha * 1.5, `${c.id} still too thin`);
      assert.ok(luminance(aged.color) < luminance(c.faded), `${c.id} faded color too washed`);
    }
  });

  it("lets iron keep more body than indigo or forest", () => {
    const iron = fadedLook(FADE_MS, colorById("iron"));
    const indigo = fadedLook(FADE_MS, colorById("indigo"));
    const forest = fadedLook(FADE_MS, colorById("forest"));
    assert.ok(iron.body > indigo.body);
    assert.ok(iron.body > forest.body);
    assert.ok(iron.alpha > indigo.alpha);
    assert.ok(iron.alpha > forest.alpha);
    assert.ok(luminance(iron.color) < luminance(indigo.color));
  });

  it("ease of fade amount and alpha helpers", () => {
    assert.equal(fadeAmount(0, FADE_MS, 0.8), 1);
    assert.equal(fadeAmount(FADE_MS, FADE_MS, 0.8), 0.8);
    assert.equal(fadeAmount(FADE_MS * 2, FADE_MS, 0.8), 0.8);
    assert.ok(appearanceAlpha(1, 1) > appearanceAlpha(1, 0));
  });
});
