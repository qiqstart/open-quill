import type { LivePoint, Point, Stroke, StrokeKind } from "./types";
import { fadedLook } from "./features/fade.ts";
import { readPencil } from "./features/pencil.ts";

export const PAGE_W = 840;
export const PAGE_H = 1188;

export const MAX_INK = 1;
export const INK_PER_PX = 1 / 10000;
export const DRY_THRESHOLD = 0.14;
export const WET_MS = 22_000;
export const FADE_MS = 3 * 60_000;
export { FADE_FLOOR } from "./features/fade.ts";
export const DWELL_BLEED_MS = 400;
export const DWELL_RADIUS = 8;

const NIB_SCALE = [0, 0.52, 0.74, 1, 1.38, 1.92];

/** Must match `--color-ink*` tokens in styles.css */
export const COLOR_WET = "#110e0a";
export const COLOR_DRY = "#3a2718";
export const COLOR_FADED = "#8d7358";
export const COLOR_SCRATCH = "#5c4a38";

export function strokeId(): string {
  return `s-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-3)}`;
}

export function readPressure(e: PointerEvent): number {
  return readPencil(e).pressure;
}

export function consumeInk(ink: number, distance: number, pressure: number): number {
  return Math.max(0, ink - distance * INK_PER_PX * (0.42 + pressure * 0.9));
}

export function nibSize(
  ink: number,
  pressure: number,
  pointerType: string,
  size = 3,
): number {
  const blunt = pointerType === "touch" ? 1.18 : 1;
  const step = NIB_SCALE[Math.min(5, Math.max(1, Math.round(size)))] ?? 1;
  if (ink <= 0.012) return 0.7 * blunt * step;
  return (1.7 + pressure * 7.2) * (0.22 + ink * 0.78) * blunt * step;
}

/** Minimum travel in page units before we keep another live sample. */
export function minLiveStep(count: number): number {
  if (count > 320) return 2.6;
  if (count > 160) return 1.6;
  if (count > 80) return 0.95;
  return 0.55;
}

export function liveSendMs(count: number): number {
  if (count > 240) return 80;
  if (count > 120) return 48;
  return 32;
}

export function shouldSkipDry(ink: number): boolean {
  if (ink > DRY_THRESHOLD) return false;
  if (ink <= 0.012) return Math.random() < 0.72;
  return Math.random() < ((DRY_THRESHOLD - ink) / DRY_THRESHOLD) * 0.58;
}

export function dripChance(
  ink: number,
  speed: number,
  overloaded: boolean,
  splotch = 0.45,
): number {
  if (splotch <= 0.02) return 0;
  let p = 0;
  if (overloaded) p += 0.035;
  if (ink > 0.92) p += 0.01;
  if (ink > 0.7 && speed < 55) p += 0.008;
  if (ink > 0.78 && speed > 420) p += 0.02;
  return p * (0.15 + splotch * 1.9);
}

export function shouldBleed(splotch: number, dwellMs: number, ink: number): boolean {
  if (splotch <= 0.08 || ink <= 0.2) return false;
  const need = DWELL_BLEED_MS * (1.35 - splotch);
  return dwellMs >= need;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

export function lerpColor(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}

export function inkAppearance(
  ageMs: number,
  swatch: { id?: string; wet: string; dry: string; faded: string } = {
    id: "iron",
    wet: COLOR_WET,
    dry: COLOR_DRY,
    faded: COLOR_FADED,
  },
): { color: string; alpha: number } {
  const look = fadedLook(ageMs, swatch, { wetMs: WET_MS, fadeMs: FADE_MS });
  return { color: look.color, alpha: look.alpha };
}

export function roundPoint(p: LivePoint, t0Perf: number): Point {
  return [
    Math.round(p.x * 10) / 10,
    Math.round(p.y * 10) / 10,
    Math.round(p.pressure * 100) / 100,
    Math.max(0, Math.round(p.t - t0Perf)),
  ];
}

export function toLive(pts: Point[], t0Perf: number): LivePoint[] {
  return pts.map(([x, y, pressure, dt]) => ({ x, y, pressure, t: t0Perf + dt }));
}

export function pathLength(pts: { x: number; y: number }[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    d += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return d;
}

export function makeBlot(
  x: number,
  y: number,
  ink: number,
  kind: StrokeKind,
  t0: number,
  extra: Partial<Pick<Stroke, "color" | "size" | "pen" | "page" | "az">> = {},
): Stroke {
  const r = kind === "bleed" ? 3.2 + ink * 7 : 1.6 + ink * 4.2;
  const pts: Point[] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wobble = 0.72 + ((Math.sin(x * 12.1 + i * 2.4) + 1) / 2) * 0.5;
    pts.push([
      Math.round((x + Math.cos(a) * r * wobble) * 10) / 10,
      Math.round((y + Math.sin(a) * r * wobble * 1.15) * 10) / 10,
      Math.min(1, 0.7 + ink * 0.3),
      i * 12,
    ]);
  }
  return { id: strokeId(), t0, ink, kind, pts, ...extra };
}

export function isWireMsg(v: unknown): v is import("./types").WireMsg {
  if (!v || typeof v !== "object") return false;
  const t = (v as { t?: unknown }).t;
  return t === "s" || t === "live" || t === "liveEnd" || t === "snap" || t === "c";
}
