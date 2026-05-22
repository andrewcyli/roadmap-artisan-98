import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CalligraphyCanvas from "./CalligraphyCanvas";
import { DEFAULT_PARAMS, STYLE_PRESETS, presetById } from "./styles";
import { timeToPhrase } from "./time";
import type { BrushParams, DebugFlags, EngineId } from "./types";

type ParamKey = keyof BrushParams;

interface SliderSpec {
  key: ParamKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SHAPE: SliderSpec[] = [
  { key: "brushSize", label: "Brush size", min: 0.4, max: 2, step: 0.05 },
  { key: "taper", label: "End taper", min: 0, max: 1, step: 0.02 },
  { key: "pressure", label: "Body pressure", min: 0, max: 1, step: 0.02 },
  { key: "endFlare", label: "Exit flare", min: 0, max: 1, step: 0.02 },
  { key: "fontFit", label: "Font fidelity", min: 0, max: 1, step: 0.02 },
];

const INK: SliderSpec[] = [
  { key: "dryBrush", label: "Dry brush", min: 0, max: 1, step: 0.02 },
  { key: "brokenBrush", label: "Broken brush", min: 0, max: 0.5, step: 0.01 },
  { key: "toneVariance", label: "Tone variance", min: 0, max: 1, step: 0.02 },
  { key: "speedThinning", label: "Speed thinning", min: 0, max: 1, step: 0.02 },
  { key: "feather", label: "Feather / bleed", min: 0, max: 1, step: 0.02 },
  { key: "bristles", label: "Bristles", min: 2, max: 14, step: 1 },
];

const PAPER: SliderSpec[] = [
  { key: "paper", label: "Paper grain", min: 0, max: 1, step: 0.02 },
  { key: "inkDarkness", label: "Ink darkness", min: 0.5, max: 1, step: 0.01 },
  { key: "speed", label: "Write speed (px/s)", min: 150, max: 1400, step: 10 },
];

function SliderRow({
  spec,
  value,
  onChange,
}: {
  spec: SliderSpec;
  value: number;
  onChange: (v: number) => void;
}) {
  const display = spec.step >= 1 ? value.toFixed(0) : value.toFixed(2);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-stone-600">{spec.label}</Label>
        <span className="font-mono text-xs text-stone-400">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        onValueChange={(arr) => onChange(arr[0])}
      />
    </div>
  );
}

const STAGE_BG =
  "rounded-xl border border-stone-300/70 shadow-inner overflow-hidden bg-[#f7f3ea]";

export default function Playground() {
  const [mode, setMode] = useState<"clock" | "text">("clock");
  const [text, setText] = useState("上午九點二十八分");
  const [now, setNow] = useState(() => new Date());
  const [view, setView] = useState<"single" | "compare">("single");
  const [engine, setEngine] = useState<EngineId>("ink");
  const [params, setParams] = useState<BrushParams>(DEFAULT_PARAMS);
  const [presetId, setPresetId] = useState("custom");
  const [debug, setDebug] = useState<DebugFlags>({
    medians: false,
    outlines: false,
    strokeNumbers: false,
  });
  const [playing, setPlaying] = useState(true);
  const [playToken, setPlayToken] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);

  const lastPhraseRef = useRef("");

  const phrase = useMemo(() => timeToPhrase(now).text, [now]);
  const chars = useMemo(
    () => Array.from(mode === "clock" ? phrase : text),
    [mode, phrase, text],
  );

  // Clock tick: re-animate whenever the spoken minute changes.
  useEffect(() => {
    if (mode !== "clock") return;
    const id = setInterval(() => {
      const next = new Date();
      const nextPhrase = timeToPhrase(next).text;
      if (nextPhrase !== lastPhraseRef.current) {
        lastPhraseRef.current = nextPhrase;
        setNow(next);
        setPlaying(true);
        setPlayToken((t) => t + 1);
      }
    }, 1000);
    lastPhraseRef.current = timeToPhrase(now).text;
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const applyPreset = (id: string) => {
    setPresetId(id);
    if (id !== "custom") setParams({ ...presetById(id).params });
  };

  const setParam = (key: ParamKey, value: number) => {
    setParams((p) => ({ ...p, [key]: value }));
    setPresetId("custom");
  };

  const replay = () => {
    setPlaying(true);
    setPlayToken((t) => t + 1);
  };

  const sharedCanvasProps = {
    chars,
    params,
    debug,
    playToken,
    playing,
    onMissing: setMissing,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/40 text-stone-800">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Magic Clock · Live Brush Calligraphy
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Stroke-order data is the structural truth. Each stroke is animated
              in order and clipped to its own outline, then inked with a living
              brush. Compare engines and tune the feel below.
            </p>
          </div>
          <Link
            to="/prototypes"
            className="text-sm text-stone-400 transition-colors hover:text-stone-700"
          >
            ← prototypes
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Stage */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={mode} onValueChange={(v) => setMode(v as "clock" | "text")}>
                <TabsList>
                  <TabsTrigger value="clock">Magic Clock</TabsTrigger>
                  <TabsTrigger value="text">Free text</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={view} onValueChange={(v) => setView(v as "single" | "compare")}>
                <TabsList>
                  <TabsTrigger value="single">Single engine</TabsTrigger>
                  <TabsTrigger value="compare">Compare A / B</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPlaying((p) => !p)}>
                  {playing ? "Pause" : "Show final"}
                </Button>
                <Button size="sm" onClick={replay}>
                  Replay ✍
                </Button>
              </div>
            </div>

            {mode === "text" && (
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="輸入繁體中文…"
                className="w-full rounded-lg border border-stone-300 bg-white/70 px-3 py-2 text-lg outline-none focus:border-stone-500"
              />
            )}

            {view === "single" ? (
              <div className={STAGE_BG}>
                <CalligraphyCanvas
                  {...sharedCanvasProps}
                  engine={engine}
                  className="h-[42vh] min-h-[260px] w-full"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className={STAGE_BG}>
                  <div className="px-3 pt-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                    A · Ink Brush
                  </div>
                  <CalligraphyCanvas
                    {...sharedCanvasProps}
                    engine="ink"
                    className="h-[36vh] min-h-[220px] w-full"
                  />
                </div>
                <div className={STAGE_BG}>
                  <div className="px-3 pt-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                    B · Outline
                  </div>
                  <CalligraphyCanvas
                    {...sharedCanvasProps}
                    engine="outline"
                    className="h-[36vh] min-h-[220px] w-full"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-500">
              <span className="font-mono text-base text-stone-700">{chars.join("")}</span>
              {missing.length > 0 && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  no stroke data for: {missing.join(" ")}
                </span>
              )}
              <label className="ml-auto flex items-center gap-2 text-xs">
                <Switch
                  checked={debug.medians}
                  onCheckedChange={(c) => setDebug((d) => ({ ...d, medians: c }))}
                />
                medians
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={debug.outlines}
                  onCheckedChange={(c) => setDebug((d) => ({ ...d, outlines: c }))}
                />
                outlines
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch
                  checked={debug.strokeNumbers}
                  onCheckedChange={(c) =>
                    setDebug((d) => ({ ...d, strokeNumbers: c }))
                  }
                />
                stroke order
              </label>
            </div>
          </div>

          {/* Controls */}
          <Card className="h-fit border-stone-200/80 bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Engine &amp; Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {view === "single" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-stone-600">Engine</Label>
                  <Select value={engine} onValueChange={(v) => setEngine(v as EngineId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ink">Ink Brush (canvas)</SelectItem>
                      <SelectItem value="outline">Outline (clip sweep)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-stone-600">Style preset</Label>
                <Select value={presetId} onValueChange={applyPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    {STYLE_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {presetId !== "custom" && (
                  <p className="text-xs text-stone-400">
                    {presetById(presetId).hint}
                  </p>
                )}
              </div>

              <Separator />
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Shape &amp; fit
              </p>
              {SHAPE.map((s) => (
                <SliderRow
                  key={s.key}
                  spec={s}
                  value={params[s.key]}
                  onChange={(v) => setParam(s.key, v)}
                />
              ))}

              <Separator />
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Living ink
              </p>
              {INK.map((s) => (
                <SliderRow
                  key={s.key}
                  spec={s}
                  value={params[s.key]}
                  onChange={(v) => setParam(s.key, v)}
                />
              ))}

              <Separator />
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Paper &amp; timing
              </p>
              {PAPER.map((s) => (
                <SliderRow
                  key={s.key}
                  spec={s}
                  value={params[s.key]}
                  onChange={(v) => setParam(s.key, v)}
                />
              ))}

              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-stone-500"
                onClick={() => {
                  setParams(DEFAULT_PARAMS);
                  setPresetId("custom");
                }}
              >
                Reset to defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
