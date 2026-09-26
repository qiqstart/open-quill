import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pageCount, pageOf, samePage, strokesOnPage } from "./pages.ts";
import type { Stroke } from "./types.ts";

function stroke(id: string, page?: number): Stroke {
  return { id, t0: 1, ink: 1, kind: "stroke", pts: [[1, 1, 0.5, 0]], page };
}

describe("letter pages", () => {
  it("treats a missing page as sheet 1", () => {
    assert.equal(pageOf(stroke("a")), 1);
    assert.equal(pageOf(stroke("b", 3)), 3);
  });

  it("filters marks onto the current sheet", () => {
    const all = [stroke("a"), stroke("b", 2), stroke("c", 1)];
    assert.deepEqual(
      strokesOnPage(all, 1).map((s) => s.id),
      ["a", "c"],
    );
    assert.deepEqual(
      strokesOnPage(all, 2).map((s) => s.id),
      ["b"],
    );
  });

  it("counts at least the highest written sheet", () => {
    assert.equal(pageCount([]), 1);
    assert.equal(pageCount([stroke("a"), stroke("b", 3)]), 3);
    assert.equal(pageCount([stroke("a")], 5), 5);
  });

  it("shows a remote pen only on the same sheet", () => {
    assert.equal(samePage(undefined, 1), true);
    assert.equal(samePage(1, 1), true);
    assert.equal(samePage(2, 1), false);
    assert.equal(samePage(2, 2), true);
    assert.equal(samePage(undefined, 2), false);
  });
});
