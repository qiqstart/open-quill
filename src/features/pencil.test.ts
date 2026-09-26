import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  REST_NIB,
  altitudeFromTilt,
  azimuthFromTilt,
  inkCostFromPencil,
  meanPressure,
  nibAngleFromPencil,
  readPencil,
  samplePointer,
  tipPressure,
} from "./pencil.ts";

describe("pencil feature", () => {
  it("treats a finger as upright with mid pressure", () => {
    const p = readPencil({ pointerType: "touch", pressure: 0.5 });
    assert.equal(p.altitude, 1);
    assert.ok(p.pressure > 0.3 && p.pressure < 0.9);
  });

  it("reads Apple Pencil altitude and azimuth when the event has them", () => {
    const upright = readPencil({
      pointerType: "pen",
      pressure: 0.6,
      altitudeAngle: Math.PI / 2,
      azimuthAngle: 0.4,
    });
    assert.ok(upright.altitude > 0.95);
    assert.equal(upright.azimuth, 0.4);

    const flat = readPencil({
      pointerType: "pen",
      pressure: 0.6,
      altitudeAngle: 0.15,
      azimuthAngle: 1.1,
    });
    assert.ok(flat.altitude < 0.2);
    assert.ok(flat.pressure > upright.pressure);
  });

  it("falls back from tiltX/tiltY when altitudeAngle is missing", () => {
    const upright = altitudeFromTilt(0, 0);
    const edged = altitudeFromTilt(60, 0);
    assert.ok(upright > 0.95);
    assert.ok(edged < upright);
    assert.ok(Number.isFinite(azimuthFromTilt(40, 10)));
  });

  it("turns the fountain nib with the pencil barrel", () => {
    const p = readPencil({
      pointerType: "pen",
      pressure: 0.5,
      altitudeAngle: 1,
      azimuthAngle: 0.8,
    });
    assert.equal(nibAngleFromPencil(p), 0.8 + REST_NIB);
  });

  it("uses more ink when the pencil is flatter and harder", () => {
    const light = inkCostFromPencil(10, { pressure: 0.2, altitude: 1, azimuth: 0 });
    const heavy = inkCostFromPencil(10, { pressure: 0.9, altitude: 0.2, azimuth: 0 });
    assert.ok(heavy > light * 1.5);
  });

  it("ignores tilt when the module is off", () => {
    const ev = {
      pointerType: "pen" as const,
      pressure: 0.5,
      altitudeAngle: 0.1,
      azimuthAngle: 1.2,
    };
    const off = samplePointer(ev, false);
    const on = samplePointer(ev, true);
    assert.equal(off.altitude, 1);
    assert.equal(off.azimuth, REST_NIB);
    assert.ok(on.pressure > off.pressure);
    assert.ok(on.altitude < 0.2);
  });

  it("reads mark pressure from the path so harder tips draw thicker", () => {
    const pts: [number, number, number, number][] = [
      [0, 0, 0.2, 0],
      [10, 0, 0.8, 20],
    ];
    assert.equal(meanPressure(pts), 0.5);
    assert.equal(tipPressure(pts), 0.8);
    assert.equal(meanPressure([]), 0.55);
    assert.ok(tipPressure(pts) > meanPressure(pts));
  });
});
