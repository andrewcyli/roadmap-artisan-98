// Shared types for the Magic Clock calligraphy renderer.
//
// Architecture (see README in Playground.tsx header):
//   stroke-order data  ->  per-stroke skeletons (medians) + outlines
//   geometry layer      ->  resample/space the skeleton, build a width profile
//   engine layer        ->  paint each stroke (Ink Brush canvas / Outline canvas)
//   effects layer       ->  paper texture, ink tone, dry/broken brush
//   animation layer     ->  sequence strokes in correct order & direction
//
// The structural truth is the stroke-order data; engines only *interpret* it,
// so strokes always stay separate and never paint over one another (each stroke
// is clipped to its own outline).

export type EngineId = "ink" | "outline";

export interface StylePreset {
  id: string;
  label: string;
  /** Human description of the calligraphic feel this preset evokes. */
  hint: string;
  params: BrushParams;
}

/**
 * Every visual knob the renderer exposes. These are deliberately engine-shared
 * so the Playground can drive both engines from one control panel and so a
 * "style" is just a named bag of these numbers.
 */
export interface BrushParams {
  // --- shape / fitting toward the chosen font -------------------------------
  /** Overall brush thickness multiplier (1 = nominal stroke thickness). */
  brushSize: number;
  /** How strongly stroke ends taper to a point (0 = blunt, 1 = sharp). */
  taper: number;
  /** Pressure swell in the body of a stroke (0 = flat, 1 = strong belly). */
  pressure: number;
  /** Hook/flare emphasis at stroke exits (na/ti energy). */
  endFlare: number;
  /** How faithfully the painted ink hugs the font outline (0 loose..1 exact). */
  fontFit: number;

  // --- living ink -----------------------------------------------------------
  /** Dry-brush streakiness: fraction of bristle gaps that show through. */
  dryBrush: number;
  /** Broken-brush: probability a bristle drops out entirely along the run. */
  brokenBrush: number;
  /** Tone variance between wet/dark and dry/light ink (0 = uniform). */
  toneVariance: number;
  /** Speed sensitivity: faster mid-stroke -> thinner & drier. */
  speedThinning: number;
  /** Soft feathered ink edge / paper absorption inside the silhouette. */
  feather: number;
  /** Bristle count for the dry-brush texture pass. */
  bristles: number;

  // --- paper & timing -------------------------------------------------------
  /** Paper grain intensity behind the ink (0 = clean). */
  paper: number;
  /** Ink darkness (0..1 -> light grey to black). */
  inkDarkness: number;
  /** Animation speed in skeleton-pixels revealed per second. */
  speed: number;
}

export interface DebugFlags {
  medians: boolean;
  outlines: boolean;
  strokeNumbers: boolean;
}

/** A single glyph placed in the layout grid (CSS px, top-left origin). */
export interface GlyphPlacement {
  char: string;
  /** Cell origin x in CSS px. */
  x: number;
  /** Cell origin y in CSS px. */
  y: number;
  /** Cell side length in CSS px (glyphs are square). */
  size: number;
}
