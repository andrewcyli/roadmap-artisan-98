// Geometry helpers: map Make-Me-a-Hanzi data space into screen space, and turn
// a sparse stroke median into a smooth, evenly arc-length-sampled skeleton with
// tangents/normals so the engines can paint a brush travelling along it.

import type { GlyphPlacement } from "./types";

/** Affine with no shear: [X, Y] = [a*x + e, d*y + f]. */
export interface Affine {
  a: number;
  d: number;
  e: number;
  f: number;
}

/** Edge of the Make Me a Hanzi EM square. */
export const EM = 1024;
/** Baseline offset baked into the data: screenY = 900 - y (then scaled). */
const BASELINE = 900;

/**
 * Matrix mapping a data-space point into the CSS-px cell described by `place`.
 * Mirrors the canonical `scale(1,-1) translate(0,-900)` transform, scaled to the
 * cell and offset to the cell origin. The Y axis is flipped (data points up).
 */
export function dataMatrix(place: GlyphPlacement, pad = 0): Affine {
  const inner = place.size - 2 * pad;
  const s = inner / EM;
  return {
    a: s,
    d: -s,
    e: place.x + pad,
    f: place.y + pad + s * BASELINE,
  };
}

export function applyMatrix(m: Affine, x: number, y: number): [number, number] {
  return [m.a * x + m.e, m.d * y + m.f];
}

/** Deterministic PRNG so per-stroke ink texture is stable across animation frames. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(...nums: number[]): number {
  let h = 2166136261;
  for (const n of nums) {
    h ^= n | 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface MedianSample {
  x: number;
  y: number;
  /** Cumulative arc length in CSS px from the stroke start. */
  s: number;
  /** Normalised position along the stroke, 0..1. */
  t: number;
  /** Unit tangent. */
  tx: number;
  ty: number;
  /** Unit normal (perpendicular, left of travel). */
  nx: number;
  ny: number;
}

export interface MedianPath {
  samples: MedianSample[];
  length: number;
}

function catmullRom(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 *
      (2 * p1[0] +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 *
      (2 * p1[1] +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

/**
 * Smooth a sparse median (data space) with Catmull-Rom, transform to CSS px and
 * resample at roughly `step` px spacing. Returns samples with tangents/normals.
 */
export function buildMedianPath(
  dataPoints: [number, number][],
  m: Affine,
  step = 2,
): MedianPath {
  const pts = dataPoints.map(([x, y]) => applyMatrix(m, x, y));

  if (pts.length === 0) return { samples: [], length: 0 };
  if (pts.length === 1) {
    const [x, y] = pts[0];
    return {
      samples: [{ x, y, s: 0, t: 0, tx: 1, ty: 0, nx: 0, ny: -1 }],
      length: 0,
    };
  }

  // Densely sample the smooth curve.
  const dense: [number, number][] = [];
  const SEG = 12;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    for (let j = 0; j < SEG; j++) {
      dense.push(catmullRom(p0, p1, p2, p3, j / SEG));
    }
  }
  dense.push(pts[pts.length - 1]);

  // Cumulative arc length over the dense polyline.
  const cum: number[] = [0];
  for (let i = 1; i < dense.length; i++) {
    const dx = dense[i][0] - dense[i - 1][0];
    const dy = dense[i][1] - dense[i - 1][1];
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  const total = cum[cum.length - 1];

  // Resample at even arc-length spacing.
  const n = Math.max(2, Math.round(total / step) + 1);
  const samples: MedianSample[] = [];
  let cursor = 0;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / (n - 1);
    while (cursor < cum.length - 2 && cum[cursor + 1] < target) cursor++;
    const segLen = cum[cursor + 1] - cum[cursor] || 1;
    const local = (target - cum[cursor]) / segLen;
    const a = dense[cursor];
    const b = dense[cursor + 1];
    const x = a[0] + (b[0] - a[0]) * local;
    const y = a[1] + (b[1] - a[1]) * local;
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    samples.push({
      x,
      y,
      s: target,
      t: total === 0 ? 0 : target / total,
      tx,
      ty,
      nx: -ty,
      ny: tx,
    });
  }
  return { samples, length: total };
}

/**
 * Per-position brush radius (CSS px) from the width profile. Combines:
 *  - a base half-thickness scaled by brushSize,
 *  - end tapers (sharper with `taper`),
 *  - a body swell (`pressure`),
 *  - an exit flare (`endFlare`) for na/ti energy.
 */
export function brushRadius(
  t: number,
  base: number,
  p: { brushSize: number; taper: number; pressure: number; endFlare: number },
): number {
  const half = base * p.brushSize;
  // Smooth taper windows at both ends.
  const win = 0.18 + 0.32 * p.taper;
  const inRamp = smoothstep(0, win, t);
  const outRamp = smoothstep(0, win, 1 - t);
  const taperK = Math.pow(Math.min(inRamp, outRamp), 0.6 + p.taper);
  // Belly swell concentrated in the middle of the stroke.
  const belly = 1 + p.pressure * 0.5 * Math.sin(Math.PI * t);
  // Exit flare: a little extra width just before the very end.
  const flare = 1 + p.endFlare * 0.6 * smoothstep(0.7, 0.95, t) * (1 - t) * 4;
  const taperFloor = 0.12; // never fully zero, keeps thin strokes visible
  return half * (taperFloor + (1 - taperFloor) * taperK) * belly * flare;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
