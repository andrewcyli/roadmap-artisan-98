// Canvas rendering pipeline shared by both engines.
//
// Per stroke we ALWAYS clip to that stroke's own outline before painting, so a
// stroke can only ever colour its own silhouette — overlapping strokes never
// bleed into each other. The two engines differ only in *how* they fill that
// clipped silhouette progressively along the median:
//   - "outline": one solid thick line swept along the skeleton (font-faithful)
//   - "ink":     textured brush dabs + bristle streaks (living brush ink)
//
// Browser-only: this module touches Path2D / DOMMatrix / canvas and must not be
// imported by unit tests (which run in jsdom without canvas).

import { STROKE_DATA } from "../data/strokeData";
import {
  Affine,
  applyMatrix,
  brushRadius,
  buildMedianPath,
  clamp,
  dataMatrix,
  hashSeed,
  MedianPath,
  mulberry32,
  smoothstep,
} from "../geometry";
import type {
  BrushParams,
  DebugFlags,
  EngineId,
  GlyphPlacement,
} from "../types";

const PAD_RATIO = 0.08; // inner padding inside each glyph cell
const NOMINAL_HALF_DATA = 54; // nominal stroke half-thickness in data units

export interface PreparedStroke {
  outline: Path2D;
  median: MedianPath;
  baseHalf: number; // nominal half-thickness in CSS px
  start: [number, number]; // CSS px, for stroke-number labels
  glyphIndex: number;
}

export interface PreparedPhrase {
  strokes: PreparedStroke[];
  placements: GlyphPlacement[];
  missing: string[];
}

/** Lay a phrase out into a row of square cells and prepare every stroke. */
export function preparePhrase(
  chars: string[],
  width: number,
  height: number,
): PreparedPhrase {
  const present = chars.filter((c) => STROKE_DATA[c]);
  const missing = chars.filter((c) => !STROKE_DATA[c]);
  const n = Math.max(1, present.length);
  const cell = Math.min(width / n, height);
  const totalW = cell * n;
  const x0 = (width - totalW) / 2;
  const y0 = (height - cell) / 2;

  const placements: GlyphPlacement[] = [];
  const strokes: PreparedStroke[] = [];

  present.forEach((char, gi) => {
    const place: GlyphPlacement = {
      char,
      x: x0 + gi * cell,
      y: y0,
      size: cell,
    };
    placements.push(place);

    const pad = cell * PAD_RATIO;
    const m = dataMatrix(place, pad);
    const dm = new DOMMatrix([m.a, 0, 0, m.d, m.e, m.f]);
    const s = m.a; // uniform scale magnitude
    const glyph = STROKE_DATA[char];

    glyph.strokes.forEach((d, si) => {
      const outline = new Path2D();
      outline.addPath(new Path2D(d), dm);
      const median = buildMedianPath(glyph.medians[si], m, 2);
      const startPt: [number, number] = applyMatrix(
        m,
        glyph.medians[si][0]?.[0] ?? 0,
        glyph.medians[si][0]?.[1] ?? 0,
      );
      strokes.push({
        outline,
        median,
        baseHalf: NOMINAL_HALF_DATA * s,
        start: startPt,
        glyphIndex: gi,
      });
    });
  });

  return { strokes, placements, missing };
}

// --- timeline -------------------------------------------------------------

export interface Timeline {
  entries: { start: number; end: number }[];
  total: number;
}

const STROKE_GAP = 80; // ms pause between strokes of one glyph
const GLYPH_GAP = 260; // extra pause when moving to the next glyph

export function buildTimeline(
  phrase: PreparedPhrase,
  params: BrushParams,
): Timeline {
  const entries: { start: number; end: number }[] = [];
  let cursor = 0;
  phrase.strokes.forEach((st, i) => {
    const prev = phrase.strokes[i - 1];
    if (prev && prev.glyphIndex !== st.glyphIndex) cursor += GLYPH_GAP;
    else if (prev) cursor += STROKE_GAP;
    const dur = 140 + (st.median.length / params.speed) * 1000;
    entries.push({ start: cursor, end: cursor + dur });
    cursor += dur;
  });
  return { entries, total: cursor };
}

export function strokeProgressAt(
  timeline: Timeline,
  index: number,
  elapsed: number,
): number {
  const e = timeline.entries[index];
  if (!e) return 0;
  if (elapsed <= e.start) return 0;
  if (elapsed >= e.end) return 1;
  return (elapsed - e.start) / (e.end - e.start);
}

// --- ink colour & brush sprite caches -------------------------------------

function inkColor(darkness: number): string {
  const v = Math.round(46 * (1 - clamp(darkness, 0, 1)));
  return `rgb(${v}, ${v - 2 < 0 ? 0 : v - 2}, ${v + 6})`;
}

const spriteCache = new Map<string, HTMLCanvasElement>();
const SPRITE = 64;

function brushSprite(color: string): HTMLCanvasElement {
  let c = spriteCache.get(color);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = SPRITE;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(
    SPRITE / 2,
    SPRITE / 2,
    0,
    SPRITE / 2,
    SPRITE / 2,
    SPRITE / 2,
  );
  grad.addColorStop(0, color);
  grad.addColorStop(0.55, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE, SPRITE);
  spriteCache.set(color, c);
  return c;
}

// --- paper texture cache --------------------------------------------------

let paperCache: { key: string; canvas: HTMLCanvasElement } | null = null;

function paperTexture(
  w: number,
  h: number,
  intensity: number,
): HTMLCanvasElement {
  const key = `${w}x${h}:${intensity.toFixed(2)}`;
  if (paperCache && paperCache.key === key) return paperCache.canvas;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  // Warm xuan-paper wash.
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#f7f3ea");
  grad.addColorStop(1, "#efe7d6");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // Fibre grain via sparse translucent flecks (deterministic).
  const rng = mulberry32(1337);
  const count = Math.floor(w * h * 0.012 * intensity);
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const len = 1 + rng() * 6;
    const a = 0.02 + rng() * 0.05 * intensity;
    g.strokeStyle = rng() > 0.5 ? `rgba(120,100,70,${a})` : `rgba(0,0,0,${a})`;
    g.lineWidth = rng() * 0.8;
    g.beginPath();
    const ang = rng() * Math.PI;
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }
  paperCache = { key, canvas: c };
  return c;
}

// --- main render ----------------------------------------------------------

export interface RenderOptions {
  engine: EngineId;
  params: BrushParams;
  debug: DebugFlags;
  /** progress 0..1 for a given global stroke index. */
  progressFor: (index: number) => number;
  dpr: number;
  width: number;
  height: number;
}

export function renderPhrase(
  ctx: CanvasRenderingContext2D,
  phrase: PreparedPhrase,
  opts: RenderOptions,
): void {
  const { params, debug, engine, progressFor, dpr, width, height } = opts;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (params.paper > 0.01) {
    ctx.drawImage(paperTexture(width, height, params.paper), 0, 0, width, height);
  } else {
    ctx.fillStyle = "#fbfaf6";
    ctx.fillRect(0, 0, width, height);
  }

  const color = inkColor(params.inkDarkness);

  phrase.strokes.forEach((st, i) => {
    const p = progressFor(i);
    if (p <= 0) return;
    ctx.save();
    ctx.clip(st.outline);
    if (engine === "outline") paintSolid(ctx, st, p, params, color);
    else paintInk(ctx, st, p, params, color, i);
    ctx.restore();
  });

  if (debug.outlines) drawOutlines(ctx, phrase);
  if (debug.medians) drawMedians(ctx, phrase, progressFor);
  if (debug.strokeNumbers) drawStrokeNumbers(ctx, phrase);
}

function cutoffIndex(median: MedianPath, p: number): number {
  const target = p * median.length;
  const s = median.samples;
  let i = 0;
  while (i < s.length - 1 && s[i].s <= target) i++;
  return i;
}

function paintSolid(
  ctx: CanvasRenderingContext2D,
  st: PreparedStroke,
  p: number,
  params: BrushParams,
  color: string,
): void {
  const s = st.median.samples;
  if (s.length === 0) return;
  const end = cutoffIndex(st.median, p);
  const width = st.baseHalf * 2 * (0.9 + params.fontFit * 1.1) * params.brushSize;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s[0].x, s[0].y);
  for (let i = 1; i <= end && i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
  if (end === 0) ctx.lineTo(s[0].x + 0.01, s[0].y);
  ctx.stroke();
}

function paintInk(
  ctx: CanvasRenderingContext2D,
  st: PreparedStroke,
  p: number,
  params: BrushParams,
  color: string,
  strokeIndex: number,
): void {
  const samples = st.median.samples;
  if (samples.length === 0) return;
  const end = cutoffIndex(st.median, p);
  const sprite = brushSprite(color);
  // Per-stroke deterministic noise lookup along arc length.
  const noiseSeed = mulberry32(hashSeed(strokeIndex, 5521));
  const noiseTable = Array.from({ length: 64 }, () => noiseSeed());
  const noiseAt = (t: number) => {
    const f = t * (noiseTable.length - 1);
    const i = Math.floor(f);
    const frac = f - i;
    const a = noiseTable[i];
    const b = noiseTable[Math.min(i + 1, noiseTable.length - 1)];
    return a + (b - a) * frac;
  };

  // Generosity: high fontFit over-paints so the clip defines an exact silhouette;
  // low fontFit keeps ink inside the outline for a looser, skeleton-led look.
  const fit = 0.62 + params.fontFit * 0.95;

  // 1) Body pass: soft dabs build tonal fill.
  let lastS = -Infinity;
  for (let i = 0; i <= end && i < samples.length; i++) {
    const smp = samples[i];
    let r = brushRadius(smp.t, st.baseHalf, params) * fit;
    // Speed thinning: the brush accelerates mid-stroke -> a touch thinner & drier.
    const speedCurve = Math.sin(Math.PI * smp.t);
    r *= 1 - params.speedThinning * 0.35 * speedCurve;
    const stepPx = Math.max(1.5, r * 0.45);
    if (smp.s - lastS < stepPx && i !== end) continue;
    lastS = smp.s;

    // Tone: wet/dark near the start, drier/lighter toward fast middle & tail.
    const tone = 1 - params.toneVariance * (0.45 * speedCurve + 0.4 * noiseAt(smp.t));
    ctx.globalAlpha = clamp(0.5 * tone + 0.2, 0.05, 1);
    ctx.drawImage(sprite, smp.x - r, smp.y - r, r * 2, r * 2);
  }

  // 2) Feather pass: faint slightly-larger dabs soften the silhouette edge
  //    (paper absorption), kept inside the clip so it never invades neighbours.
  if (params.feather > 0.02) {
    ctx.globalAlpha = 0.06 * params.feather;
    for (let i = 0; i <= end && i < samples.length; i += 3) {
      const smp = samples[i];
      const r = brushRadius(smp.t, st.baseHalf, params) * fit * 1.25;
      ctx.drawImage(sprite, smp.x - r, smp.y - r, r * 2, r * 2);
    }
  }

  // 3) Dry / broken brush: thin bristle streaks offset across the brush width.
  if (params.dryBrush > 0.02 && params.bristles >= 2) {
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    const bristles = Math.round(params.bristles);
    for (let k = 0; k < bristles; k++) {
      const off = (k / (bristles - 1) - 0.5) * 2; // -1..1 across width
      // Each bristle may drop out entirely (broken brush). Deterministic per
      // (stroke, bristle) so the texture is stable across animation frames.
      if (mulberry32(hashSeed(strokeIndex, k, 31))() < params.brokenBrush) continue;
      ctx.lineWidth = Math.max(0.6, st.baseHalf * 0.16 * params.brushSize);
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= end && i < samples.length; i++) {
        const smp = samples[i];
        const r = brushRadius(smp.t, st.baseHalf, params) * fit;
        const px = smp.x + smp.nx * off * r * 0.9;
        const py = smp.y + smp.ny * off * r * 0.9;
        // Gaps: drier where dryBrush is high and toward the fast tail.
        // Position-keyed hash keeps the streaks from boiling as the reveal grows.
        const dryHere =
          params.dryBrush * (0.4 + 0.6 * smoothstep(0.35, 1, smp.t));
        const gap = mulberry32(hashSeed(strokeIndex, k, i + 7))() < dryHere * 0.5;
        if (gap) {
          pen = false;
          continue;
        }
        if (!pen) {
          ctx.moveTo(px, py);
          pen = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.globalAlpha = clamp(0.18 + 0.5 * params.dryBrush, 0.05, 0.8);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}

// --- debug overlays -------------------------------------------------------

function drawOutlines(ctx: CanvasRenderingContext2D, phrase: PreparedPhrase) {
  ctx.save();
  ctx.strokeStyle = "rgba(220,60,60,0.7)";
  ctx.lineWidth = 1;
  phrase.strokes.forEach((st) => ctx.stroke(st.outline));
  ctx.restore();
}

function drawMedians(
  ctx: CanvasRenderingContext2D,
  phrase: PreparedPhrase,
  progressFor: (i: number) => number,
) {
  ctx.save();
  phrase.strokes.forEach((st, i) => {
    const s = st.median.samples;
    if (s.length < 2) return;
    const end = cutoffIndex(st.median, progressFor(i));
    ctx.strokeStyle = "rgba(40,120,220,0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s[0].x, s[0].y);
    for (let j = 1; j <= end && j < s.length; j++) ctx.lineTo(s[j].x, s[j].y);
    ctx.stroke();
    // direction dot at the leading edge
    const head = s[Math.min(end, s.length - 1)];
    ctx.fillStyle = "rgba(40,120,220,0.95)";
    ctx.beginPath();
    ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawStrokeNumbers(
  ctx: CanvasRenderingContext2D,
  phrase: PreparedPhrase,
) {
  ctx.save();
  ctx.font = "11px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Number strokes within each glyph (1-based per glyph).
  const perGlyph = new Map<number, number>();
  phrase.strokes.forEach((st) => {
    const n = (perGlyph.get(st.glyphIndex) ?? 0) + 1;
    perGlyph.set(st.glyphIndex, n);
    ctx.fillStyle = "rgba(20,20,30,0.9)";
    ctx.beginPath();
    ctx.arc(st.start[0], st.start[1], 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
    ctx.strokeStyle = "rgba(20,20,30,0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(20,20,30,0.95)";
    ctx.fillText(String(n), st.start[0], st.start[1] + 0.5);
  });
  ctx.restore();
}

export { dataMatrix, applyMatrix };
export type { Affine };
