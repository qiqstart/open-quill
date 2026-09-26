import { getStroke } from "perfect-freehand";
import { drawCalligraphy, drawLiveFountain } from "./calligraphy";
import { fillGaps, ribbonGap } from "./connect";
import { lastNibAngle, meanPressure, tipPressure } from "./features/pencil";
import { cssToPage, pageToCss } from "./features/page-move";
import { COLOR_SCRATCH, PAGE_H, PAGE_W, inkAppearance, nibSize } from "./ink";
import { colorById } from "./settings";
import type { LiveMark, Point, Stroke, View } from "./types";

export { pageToCss };

export function fitView(cssW: number, cssH: number): View {
  const dpr = Math.min(2.5, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1);
  const scale = Math.min(cssW / PAGE_W, cssH / PAGE_H);
  const ox = (cssW - PAGE_W * scale) / 2;
  const oy = (cssH - PAGE_H * scale) / 2;
  return { scale, ox, oy, cssW, cssH, dpr, rot: 0 };
}

export function pageRect(view: View) {
  return {
    x: view.ox,
    y: view.oy,
    w: PAGE_W * view.scale,
    h: PAGE_H * view.scale,
    rot: view.rot ?? 0,
  };
}

export function clientToPage(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  view: View,
): { x: number; y: number } {
  return cssToPage(clientX - rect.left, clientY - rect.top, view);
}

export function onPage(x: number, y: number, pad = 6): boolean {
  return x >= -pad && y >= -pad && x <= PAGE_W + pad && y <= PAGE_H + pad;
}

export function sizeCanvas(canvas: HTMLCanvasElement, view: View) {
  const w = Math.max(1, Math.round(view.cssW * view.dpr));
  const h = Math.max(1, Math.round(view.cssH * view.dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}

export function pageTransform(ctx: CanvasRenderingContext2D, view: View) {
  const rot = view.rot ?? 0;
  const dpr = view.dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = view.ox + (PAGE_W * view.scale) / 2;
  const cy = view.oy + (PAGE_H * view.scale) / 2;
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.translate((-PAGE_W * view.scale) / 2, (-PAGE_H * view.scale) / 2);
  ctx.scale(view.scale, view.scale);
}

function outlineFrom(pts: Point[], size: number): number[][] {
  if (pts.length === 0) return [];
  const input = fillGaps(pts, Math.max(0.4, size * 0.35)).map(([x, y, p]) => ({
    x,
    y,
    pressure: p,
  }));
  return getStroke(input, {
    size,
    thinning: 0.62,
    smoothing: 0.4,
    streamline: 0.45,
    start: { taper: 1.2, cap: true },
    end: { taper: Math.max(2, size * 1.35), cap: true },
  });
}

function strokeSmooth(ctx: CanvasRenderingContext2D, pts: Point[], lineWidth: number) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  if (pts.length === 2) {
    ctx.lineTo(pts[1]![0], pts[1]![1]);
    ctx.stroke();
    return;
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const xMid = (pts[i]![0] + pts[i + 1]![0]) / 2;
    const yMid = (pts[i]![1] + pts[i + 1]![1]) / 2;
    ctx.quadraticCurveTo(pts[i]![0], pts[i]![1], xMid, yMid);
  }
  const last = pts[pts.length - 1]!;
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
}

export function fillOutline(ctx: CanvasRenderingContext2D, outline: number[][]) {
  if (outline.length < 3) return false;
  ctx.beginPath();
  ctx.moveTo(outline[0]![0], outline[0]![1]);
  for (let i = 1; i < outline.length; i++) {
    ctx.lineTo(outline[i]![0], outline[i]![1]);
  }
  ctx.closePath();
  ctx.fill();
  return true;
}

export function drawBlot(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.pts.length === 0) return;
  const outline = outlineFrom(stroke.pts, 6 + stroke.ink * 10);
  if (!fillOutline(ctx, outline)) {
    const [x, y] = stroke.pts[0]!;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.2 + stroke.ink * 3, 2.8 + stroke.ink * 3.6, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawStrokePath(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  ink: number,
  size = 3,
  pen: "quill" | "fountain" = "quill",
  cache?: Map<string, number[][]>,
  cacheKey?: string,
  az?: number,
) {
  if (pts.length === 0) return;
  if (pen === "fountain") {
    drawCalligraphy(ctx, pts, ink, size, az ?? lastNibAngle());
    return;
  }
  if (pts.length === 1) {
    const [x, y, p] = pts[0]!;
    const r = nibSize(ink, p, "pen", size) * 0.28;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.6, r), 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const nib = nibSize(ink, meanPressure(pts), "pen", size);
  let outline = cacheKey && !cacheKey.endsWith("-live") ? cache?.get(cacheKey) : undefined;
  if (!outline) {
    outline = outlineFrom(pts, nib);
    if (cache && cacheKey && !cacheKey.endsWith("-live")) cache.set(cacheKey, outline);
  }
  if (ink <= 0.012) {
    ctx.strokeStyle = COLOR_SCRATCH;
    ctx.globalAlpha = 0.28;
    strokeSmooth(ctx, fillGaps(pts, ribbonGap(0.7)), 0.7);
    ctx.globalAlpha = 1;
    return;
  }
  fillOutline(ctx, outline);
}

export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  now: number,
  view: View,
  cache: Map<string, number[][]>,
  playbackAge = false,
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, view.cssW * view.dpr, view.cssH * view.dpr);
  pageTransform(ctx, view);
  for (const s of strokes) {
    const age = playbackAge ? 0 : Math.max(0, now - s.t0);
    const look = inkAppearance(age, colorById(s.color));
    ctx.globalAlpha = look.alpha;
    ctx.fillStyle = look.color;
    ctx.strokeStyle = look.color;
    if (s.kind === "drip" || s.kind === "bleed") drawBlot(ctx, s);
    else drawStrokePath(ctx, s.pts, s.ink, s.size ?? 3, s.pen ?? "quill", cache, s.id, s.az);
  }
  ctx.globalAlpha = 1;
}

export function drawLive(ctx: CanvasRenderingContext2D, groups: LiveMark[], view: View) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, view.cssW * view.dpr, view.cssH * view.dpr);
  pageTransform(ctx, view);
  for (const g of groups) {
    if (g.pts.length === 0) continue;
    const wet = colorById(g.color).wet;
    ctx.fillStyle = wet;
    ctx.strokeStyle = wet;
    ctx.globalAlpha = 0.96;
    if (g.ink <= 0.012) {
      ctx.strokeStyle = COLOR_SCRATCH;
      ctx.globalAlpha = 0.3;
      strokeSmooth(ctx, fillGaps(g.pts, ribbonGap(0.7)), 0.7);
      continue;
    }
    if (g.pen === "fountain") {
      drawLiveFountain(ctx, g.pts, g.ink, g.size ?? 3, g.az ?? lastNibAngle());
      continue;
    }
    if (g.pts.length === 1) {
      const [x, y, p] = g.pts[0]!;
      const r = nibSize(g.ink, p, "pen", g.size ?? 3) * 0.28;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, r), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    const nib = Math.max(0.8, nibSize(g.ink, tipPressure(g.pts), "pen", g.size ?? 3) * 0.52);
    strokeSmooth(ctx, fillGaps(g.pts, ribbonGap(nib)), nib);
  }
  ctx.globalAlpha = 1;
}

/** Paint only a new fountain tail. Sets page space; does not clear. */
export function appendLiveFountain(ctx: CanvasRenderingContext2D, view: View, mark: LiveMark) {
  pageTransform(ctx, view);
  const wet = colorById(mark.color).wet;
  ctx.fillStyle = wet;
  ctx.strokeStyle = wet;
  ctx.globalAlpha = 0.96;
  drawLiveFountain(ctx, mark.pts, mark.ink, mark.size ?? 3, mark.az ?? lastNibAngle());
  ctx.globalAlpha = 1;
}
