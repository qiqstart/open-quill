/**
 * Per-ink fade body. Dry-down (wet → dry) stays in core timing;
 * this module only decides how much pigment remains after the long fade.
 *
 * Body is 0–1. Higher = denser dried film (less pale, less transparent).
 * Values are baked in — not a desk setting.
 */

export type InkSwatch = {
  id?: string;
  wet: string;
  dry: string;
  faded: string;
};

/** How much film each named ink keeps after it dries. */
export const INK_BODY: Record<string, number> = {
  iron: 0.9,
  sepia: 0.84,
  oxblood: 0.82,
  indigo: 0.74,
  forest: 0.7,
};

export const DEFAULT_BODY = 0.82;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function bodyFor(id: string | undefined, bodies: Record<string, number> = INK_BODY): number {
  if (id && id in bodies) return clamp01(bodies[id]!);
  return DEFAULT_BODY;
}

/** Alpha floor after the long fade. Body 0 → 0.62, body 1 → 0.94. */
export function fadeFloor(body: number): number {
  return 0.62 + clamp01(body) * 0.32;
}

export const FADE_FLOOR = fadeFloor(DEFAULT_BODY);

/** Share of the dry color kept in the faded mix. Pale hex is the rest. */
export function bodyMix(body: number): number {
  return clamp01(body) * 0.62;
}

export function fadeAmount(ageMs: number, fadeMs: number, floor: number): number {
  if (fadeMs <= 0) return floor;
  return Math.max(floor, 1 - (ageMs / fadeMs) * (1 - floor));
}

export function appearanceAlpha(fade: number, wet: number): number {
  return fade * (0.94 + clamp01(wet) * 0.06);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function fadedLook(
  ageMs: number,
  swatch: InkSwatch,
  timing: { wetMs: number; fadeMs: number } = { wetMs: 22_000, fadeMs: 3 * 60_000 },
): { color: string; alpha: number; wet: number; fade: number; body: number } {
  const body = bodyFor(swatch.id);
  const floor = fadeFloor(body);
  const wet = Math.max(0, 1 - Math.max(0, ageMs) / timing.wetMs);
  const fade = fadeAmount(Math.max(0, ageMs), timing.fadeMs, floor);
  const dried = mixHex(swatch.dry, swatch.wet, wet);
  const faded = mixHex(swatch.faded, swatch.dry, bodyMix(body));
  const span = Math.max(1e-6, 1 - floor);
  const color = mixHex(faded, dried, (fade - floor) / span);
  return { color, alpha: appearanceAlpha(fade, wet), wet, fade, body };
}
