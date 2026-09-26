import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "../settings.ts";
import {
  DEFAULT_FLAGS,
  FEATURE_IDS,
  isEnabled,
  loadFlags,
  parseFlags,
  saveFlags,
} from "./flags.ts";

describe("feature flags", () => {
  it("names every module and defaults them on", () => {
    assert.deepEqual(FEATURE_IDS, ["fade", "pencil", "trace", "page-move", "page-play"]);
    for (const id of FEATURE_IDS) assert.equal(DEFAULT_FLAGS[id], true);
  });

  it("can turn a module off without dropping the others", () => {
    const flags = parseFlags({ "page-play": false, extra: true });
    assert.equal(flags["page-play"], false);
    assert.equal(flags.fade, true);
    assert.equal(isEnabled("page-play", flags), false);
    assert.equal(isEnabled("trace", flags), true);
  });

  it("round-trips through storage", () => {
    const store = memoryStore();
    saveFlags({ ...DEFAULT_FLAGS, pencil: false }, store);
    const loaded = loadFlags(store);
    assert.equal(loaded.pencil, false);
    assert.equal(loaded.fade, true);
  });

  it("returns defaults when storage is empty or corrupt", () => {
    assert.deepEqual(loadFlags(memoryStore()), DEFAULT_FLAGS);
    const bad = memoryStore({ "pen-and-quill:features": "not-json" });
    assert.deepEqual(loadFlags(bad), DEFAULT_FLAGS);
  });
});
