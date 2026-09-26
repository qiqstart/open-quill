import { PAGE_H, PAGE_W } from "../ink.ts";
import type { View } from "../types";

export type PageMove = {
  zoom: number;
  tx: number;
  ty: number;
  rot: number;
};

export const IDENTITY: PageMove = { zoom: 1, tx: 0, ty: 0, rot: 0 };
export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 4.2;

export function clampMove(m: PageMove): PageMove {
  return {
    zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, m.zoom)),
    tx: m.tx,
    ty: m.ty,
    rot: m.rot,
  };
}

export function composeView(base: View, move: PageMove): View {
  const m = clampMove(move);
  const scale = base.scale * m.zoom;
  const cx = base.ox + (PAGE_W * base.scale) / 2;
  const cy = base.oy + (PAGE_H * base.scale) / 2;
  return {
    ...base,
    scale,
    ox: cx - (PAGE_W * scale) / 2 + m.tx,
    oy: cy - (PAGE_H * scale) / 2 + m.ty,
    rot: m.rot,
  };
}

export function pageToCss(x: number, y: number, view: View): { x: number; y: number } {
  const rot = view.rot ?? 0;
  const cx = view.ox + (PAGE_W * view.scale) / 2;
  const cy = view.oy + (PAGE_H * view.scale) / 2;
  const px = (x - PAGE_W / 2) * view.scale;
  const py = (y - PAGE_H / 2) * view.scale;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return { x: cx + px * c - py * s, y: cy + px * s + py * c };
}

export function cssToPage(x: number, y: number, view: View): { x: number; y: number } {
  const rot = view.rot ?? 0;
  const cx = view.ox + (PAGE_W * view.scale) / 2;
  const cy = view.oy + (PAGE_H * view.scale) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const c = Math.cos(-rot);
  const s = Math.sin(-rot);
  const rx = dx * c - dy * s;
  const ry = dx * s + dy * c;
  return { x: rx / view.scale + PAGE_W / 2, y: ry / view.scale + PAGE_H / 2 };
}

export function panBy(move: PageMove, dx: number, dy: number): PageMove {
  return { ...move, tx: move.tx + dx, ty: move.ty + dy };
}

function keepPoint(move: PageMove, next: PageMove, cssX: number, cssY: number, base: View): PageMove {
  const before = cssToPage(cssX, cssY, composeView(base, move));
  const afterCss = pageToCss(before.x, before.y, composeView(base, next));
  return { ...next, tx: next.tx + cssX - afterCss.x, ty: next.ty + cssY - afterCss.y };
}

export function zoomAt(move: PageMove, factor: number, cssX: number, cssY: number, base: View): PageMove {
  const next = clampMove({ ...move, zoom: move.zoom * factor });
  return keepPoint(move, next, cssX, cssY, base);
}

export function rotateAt(move: PageMove, dRot: number, cssX: number, cssY: number, base: View): PageMove {
  const next = { ...move, rot: move.rot + dRot };
  return keepPoint(move, next, cssX, cssY, base);
}

export type PointerPt = { x: number; y: number };

export function pairMetrics(a: PointerPt, b: PointerPt) {
  return {
    midX: (a.x + b.x) / 2,
    midY: (a.y + b.y) / 2,
    dist: Math.hypot(b.x - a.x, b.y - a.y),
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}
