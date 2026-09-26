/** Compact point: x, y, pressure 0–1, dt ms from stroke start. */
export type Point = [x: number, y: number, p: number, dt: number];

export type StrokeKind = "stroke" | "drip" | "bleed";

export type Stroke = {
  id: string;
  t0: number;
  ink: number;
  kind: StrokeKind;
  pts: Point[];
  color?: string;
  size?: number;
  pen?: "quill" | "fountain";
  page?: number;
  /** Fountain nib angle in radians, from Apple Pencil azimuth. */
  az?: number;
};

export type LivePoint = {
  x: number;
  y: number;
  pressure: number;
  t: number;
};

export type View = {
  scale: number;
  ox: number;
  oy: number;
  cssW: number;
  cssH: number;
  dpr: number;
  rot?: number;
};

export type PeerCursor = {
  x: number;
  y: number;
  ink: number;
  page?: number;
};

export type LiveMark = {
  pts: Point[];
  ink: number;
  color?: string;
  size?: number;
  pen?: "quill" | "fountain";
  page?: number;
  az?: number;
};

export type WireMsg =
  | { t: "s"; stroke: Stroke }
  | { t: "live"; id: string; pts: Point[]; ink: number; color?: string; size?: number; pen?: "quill" | "fountain"; page?: number; az?: number }
  | { t: "liveEnd"; id: string }
  | { t: "snap"; strokes: Stroke[] }
  | { t: "c"; x: number; y: number; ink: number; page?: number };
