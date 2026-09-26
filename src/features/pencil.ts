/** Same rest slant as the fountain nib. Kept here so this module stays standalone. */
export const REST_NIB = -Math.PI / 5;

function rawPressure(e: { pointerType: string; pressure: number }): number {
  if (e.pointerType === "pen") return e.pressure > 0.02 ? e.pressure : 0.5;
  if (e.pointerType === "mouse") return 0.52;
  return 0.64;
}

/** 0 = laid flat on the page, 1 = standing straight up. */
export type Pencil = {
  pressure: number;
  altitude: number;
  azimuth: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

let lastAngle = REST_NIB;

export function lastNibAngle(): number {
  return lastAngle;
}

export function altitudeFromTilt(tiltX: number, tiltY: number): number {
  const tx = (tiltX * Math.PI) / 180;
  const ty = (tiltY * Math.PI) / 180;
  const flat = Math.min(1, Math.hypot(Math.sin(tx), Math.sin(ty)));
  return clamp(Math.acos(flat) / (Math.PI / 2), 0, 1);
}

export function azimuthFromTilt(tiltX: number, tiltY: number): number {
  const tx = (tiltX * Math.PI) / 180;
  const ty = (tiltY * Math.PI) / 180;
  return Math.atan2(Math.sin(tx), Math.sin(ty));
}

export function readPencil(e: {
  pointerType: string;
  pressure: number;
  altitudeAngle?: number;
  azimuthAngle?: number;
  tiltX?: number;
  tiltY?: number;
}): Pencil {
  const raw = rawPressure(e);
  let altitude = 1;
  let azimuth = REST_NIB;

  if (e.pointerType === "pen") {
    if (typeof e.altitudeAngle === "number" && Number.isFinite(e.altitudeAngle)) {
      altitude = clamp(e.altitudeAngle / (Math.PI / 2), 0, 1);
    } else if (typeof e.tiltX === "number" && typeof e.tiltY === "number") {
      altitude = altitudeFromTilt(e.tiltX, e.tiltY);
    }
    if (typeof e.azimuthAngle === "number" && Number.isFinite(e.azimuthAngle)) {
      azimuth = e.azimuthAngle;
    } else if (typeof e.tiltX === "number" && typeof e.tiltY === "number") {
      azimuth = azimuthFromTilt(e.tiltX, e.tiltY);
    }
  }

  const flat = 1 - altitude;
  const pressure = clamp(raw * (0.72 + flat * 0.7), 0.08, 1);
  const sample = { pressure, altitude, azimuth };
  lastAngle = nibAngleFromPencil(sample);
  return sample;
}

/** Finger/mouse stay upright. When the module is off, ignore tilt and barrel. */
export function samplePointer(
  e: {
    pointerType: string;
    pressure: number;
    altitudeAngle?: number;
    azimuthAngle?: number;
    tiltX?: number;
    tiltY?: number;
  },
  enabled = true,
): Pencil {
  if (!enabled) {
    return { pressure: rawPressure(e), altitude: 1, azimuth: REST_NIB };
  }
  return readPencil(e);
}

export function nibAngleFromPencil(p: Pencil): number {
  return p.azimuth + REST_NIB;
}

export function inkCostFromPencil(distance: number, p: Pencil): number {
  const heavy = 0.42 + p.pressure * 0.9 + (1 - p.altitude) * 0.35;
  return distance * heavy;
}

export function meanPressure(pts: [number, number, number, number][]): number {
  if (pts.length === 0) return 0.55;
  let s = 0;
  for (const pt of pts) s += pt[2];
  return s / pts.length;
}

export function tipPressure(pts: [number, number, number, number][]): number {
  if (pts.length === 0) return 0.55;
  return pts[pts.length - 1]![2];
}
