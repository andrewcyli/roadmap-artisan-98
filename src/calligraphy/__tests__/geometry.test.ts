import { describe, expect, it } from "vitest";
import {
  applyMatrix,
  brushRadius,
  buildMedianPath,
  dataMatrix,
  EM,
} from "../geometry";
import type { GlyphPlacement } from "../types";

const place: GlyphPlacement = { char: "一", x: 0, y: 0, size: EM };

describe("dataMatrix", () => {
  it("maps the EM square into the cell with a flipped Y axis", () => {
    const m = dataMatrix(place, 0);
    // baseline (y=0 data) sits near the bottom of the cell
    expect(applyMatrix(m, 0, 0)).toEqual([0, 900]);
    // ascent (y=900) maps to the top
    expect(applyMatrix(m, 0, 900)).toEqual([0, 0]);
    // full descent..ascent fills the cell height
    expect(applyMatrix(m, EM, -124)).toEqual([EM, EM]);
  });

  it("honours padding and cell origin", () => {
    const p: GlyphPlacement = { char: "一", x: 100, y: 50, size: 200 };
    const m = dataMatrix(p, 20);
    const [x, y] = applyMatrix(m, 0, 900);
    expect(x).toBeCloseTo(120); // x origin + pad
    expect(y).toBeCloseTo(70); // y origin + pad
  });
});

describe("buildMedianPath", () => {
  const m = dataMatrix(place, 0);

  it("produces increasing arc length and normalised t over a straight median", () => {
    const path = buildMedianPath(
      [
        [0, 500],
        [EM, 500],
      ],
      m,
      4,
    );
    expect(path.length).toBeGreaterThan(900);
    expect(path.samples[0].t).toBeCloseTo(0);
    expect(path.samples[path.samples.length - 1].t).toBeCloseTo(1);
    for (let i = 1; i < path.samples.length; i++) {
      expect(path.samples[i].s).toBeGreaterThanOrEqual(path.samples[i - 1].s);
    }
  });

  it("orients the tangent along travel and the normal perpendicular", () => {
    const path = buildMedianPath(
      [
        [0, 500],
        [EM, 500],
      ],
      m,
      8,
    );
    const mid = path.samples[Math.floor(path.samples.length / 2)];
    expect(Math.abs(mid.tx)).toBeCloseTo(1, 1);
    expect(Math.abs(mid.ty)).toBeCloseTo(0, 1);
    // tangent . normal == 0
    expect(mid.tx * mid.nx + mid.ty * mid.ny).toBeCloseTo(0, 5);
  });

  it("handles a single-point (dot) median without crashing", () => {
    const path = buildMedianPath([[512, 512]], m, 4);
    expect(path.length).toBe(0);
    expect(path.samples).toHaveLength(1);
  });
});

describe("brushRadius", () => {
  const p = { brushSize: 1, taper: 0.6, pressure: 0.5, endFlare: 0.4 };

  it("tapers thinner at the ends than the middle", () => {
    const start = brushRadius(0.02, 50, p);
    const mid = brushRadius(0.5, 50, p);
    const end = brushRadius(0.98, 50, p);
    expect(mid).toBeGreaterThan(start);
    expect(mid).toBeGreaterThan(end);
  });

  it("scales with brush size", () => {
    const small = brushRadius(0.5, 50, { ...p, brushSize: 0.5 });
    const big = brushRadius(0.5, 50, { ...p, brushSize: 2 });
    expect(big).toBeGreaterThan(small);
  });
});
