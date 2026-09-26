import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PAGE_H, PAGE_W } from "../ink.ts";
import type { View } from "../types.ts";
import {
  IDENTITY,
  ZOOM_MAX,
  clampMove,
  composeView,
  cssToPage,
  pageToCss,
  panBy,
  pairMetrics,
  rotateAt,
  zoomAt,
} from "./page-move.ts";

const base: View = { scale: 1, ox: 80, oy: 40, cssW: 1000, cssH: 1300, dpr: 1, rot: 0 };

function almost(a: number, b: number, eps = 0.02) {
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
}

describe("page move", () => {
  it("pans the sheet in css pixels", () => {
    const v = composeView(base, panBy(IDENTITY, 12, -8));
    almost(v.ox, base.ox + 12);
    almost(v.oy, base.oy - 8);
    almost(v.scale, 1);
  });

  it("zooms around a point so that page spot stays under the fingers", () => {
    const cssX = 200;
    const cssY = 300;
    const before = cssToPage(cssX, cssY, composeView(base, IDENTITY));
    const moved = zoomAt(IDENTITY, 2, cssX, cssY, base);
    almost(moved.zoom, 2);
    const after = cssToPage(cssX, cssY, composeView(base, moved));
    almost(after.x, before.x);
    almost(after.y, before.y);
  });

  it("turns around a point without sliding that point", () => {
    const cssX = 200;
    const cssY = 300;
    const before = cssToPage(cssX, cssY, composeView(base, IDENTITY));
    const moved = rotateAt(IDENTITY, Math.PI / 2, cssX, cssY, base);
    almost(moved.rot, Math.PI / 2);
    const after = cssToPage(cssX, cssY, composeView(base, moved));
    almost(after.x, before.x, 0.05);
    almost(after.y, before.y, 0.05);
  });

  it("round-trips page and css at rest", () => {
    const page = { x: PAGE_W / 2, y: PAGE_H / 3 };
    const css = pageToCss(page.x, page.y, composeView(base, IDENTITY));
    const back = cssToPage(css.x, css.y, composeView(base, IDENTITY));
    almost(back.x, page.x);
    almost(back.y, page.y);
  });

  it("clamps zoom and reads a two-finger span", () => {
    assert.equal(clampMove({ zoom: 99, tx: 0, ty: 0, rot: 0 }).zoom, ZOOM_MAX);
    const m = pairMetrics({ x: 0, y: 0 }, { x: 30, y: 40 });
    almost(m.dist, 50);
    almost(m.midX, 15);
  });
});
