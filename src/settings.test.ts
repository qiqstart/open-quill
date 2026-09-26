import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  INK_COLORS,
  STORAGE_KEY,
  loadSettings,
  memoryStore,
  parseSettings,
  saveSettings,
} from "./settings.ts";

describe("desk settings", () => {
  it("has five named inks", () => {
    assert.equal(INK_COLORS.length, 5);
    assert.deepEqual(
      INK_COLORS.map((c) => c.id),
      ["iron", "sepia", "indigo", "oxblood", "forest"],
    );
  });

  it("defaults to iron gall, medium nib, modest splotch, quill", () => {
    assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
    assert.equal(DEFAULT_SETTINGS.color, "iron");
    assert.equal(DEFAULT_SETTINGS.size, 3);
    assert.equal(DEFAULT_SETTINGS.splotch, 0.45);
    assert.equal(DEFAULT_SETTINGS.pen, "quill");
  });

  it("clamps size to 1–5 and splotch to 0–1", () => {
    const s = parseSettings({ color: "sepia", size: 99, splotch: 4, pen: "fountain" });
    assert.equal(s.size, 5);
    assert.equal(s.splotch, 1);
    assert.equal(s.color, "sepia");
    assert.equal(s.pen, "fountain");
    const low = parseSettings({ size: 0, splotch: -2, color: "nope", pen: "felt" });
    assert.equal(low.size, 1);
    assert.equal(low.splotch, 0);
    assert.equal(low.color, "iron");
    assert.equal(low.pen, "quill");
  });

  it("round-trips through local storage", () => {
    const store = memoryStore();
    const saved = saveSettings(
      { color: "indigo", size: 1, splotch: 0.1, pen: "fountain" },
      store,
    );
    assert.equal(store.data[STORAGE_KEY]?.includes("indigo"), true);
    assert.deepEqual(loadSettings(store), saved);
  });

  it("returns defaults when storage is empty or corrupt", () => {
    assert.deepEqual(loadSettings(memoryStore()), DEFAULT_SETTINGS);
    assert.deepEqual(loadSettings(memoryStore({ [STORAGE_KEY]: "{not json" })), DEFAULT_SETTINGS);
  });
});
