import { useEffect, useLayoutEffect, useRef } from "react";
import {
  buildTimeline,
  preparePhrase,
  renderPhrase,
  strokeProgressAt,
  type PreparedPhrase,
  type Timeline,
} from "./engines/render";
import type { BrushParams, DebugFlags, EngineId } from "./types";

interface Props {
  chars: string[];
  engine: EngineId;
  params: BrushParams;
  debug: DebugFlags;
  /** Bump this number to (re)start the writing animation. */
  playToken: number;
  /** When false, the finished character is shown immediately. */
  playing: boolean;
  className?: string;
  onMissing?: (missing: string[]) => void;
  onDone?: () => void;
}

const ALL_DONE = () => 1;

export default function CalligraphyCanvas({
  chars,
  engine,
  params,
  debug,
  playToken,
  playing,
  className,
  onMissing,
  onDone,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const preparedRef = useRef<PreparedPhrase | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const playingRef = useRef(false);
  const doneFiredRef = useRef(false);

  // Keep latest props in refs so the RAF loop always reads fresh values.
  const paramsRef = useRef(params);
  const engineRef = useRef(engine);
  const debugRef = useRef(debug);
  paramsRef.current = params;
  engineRef.current = engine;
  debugRef.current = debug;

  const draw = (progressFor: (i: number) => number) => {
    const canvas = canvasRef.current;
    const prepared = preparedRef.current;
    if (!canvas || !prepared) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    renderPhrase(ctx, prepared, {
      engine: engineRef.current,
      params: paramsRef.current,
      debug: debugRef.current,
      progressFor,
      dpr,
      width: w,
      height: h,
    });
  };

  const drawStatic = () => {
    if (rafRef.current != null) return; // animation owns the surface
    draw(ALL_DONE);
  };

  const loop = () => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    const elapsed = performance.now() - startRef.current;
    draw((i) => strokeProgressAt(timeline, i, elapsed));
    if (elapsed < timeline.total + 150) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      rafRef.current = null;
      playingRef.current = false;
      draw(ALL_DONE);
      if (!doneFiredRef.current) {
        doneFiredRef.current = true;
        onDone?.();
      }
    }
  };

  // Size the backing store to the container and device pixel ratio.
  const measure = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    sizeRef.current = { w, h, dpr };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    preparedRef.current = preparePhrase(chars, w, h);
    timelineRef.current = buildTimeline(preparedRef.current, paramsRef.current);
    onMissing?.(preparedRef.current.missing);
  };

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => {
      measure();
      if (rafRef.current == null) draw(ALL_DONE);
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild geometry when the phrase changes.
  useEffect(() => {
    measure();
    if (rafRef.current == null) drawStatic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chars.join("")]);

  // Rebuild timeline when animation speed changes.
  useEffect(() => {
    if (preparedRef.current) {
      timelineRef.current = buildTimeline(preparedRef.current, paramsRef.current);
    }
  }, [params.speed]);

  // Static redraw on any style / engine / debug change while paused.
  useEffect(() => {
    if (rafRef.current == null) draw(ALL_DONE);
  }, [params, engine, debug]);

  // Start / restart the animation when asked.
  useEffect(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    doneFiredRef.current = false;
    if (playing) {
      timelineRef.current = buildTimeline(
        preparedRef.current ?? preparePhrase(chars, 1, 1),
        paramsRef.current,
      );
      startRef.current = performance.now();
      playingRef.current = true;
      rafRef.current = requestAnimationFrame(loop);
    } else {
      draw(ALL_DONE);
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken, playing]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
