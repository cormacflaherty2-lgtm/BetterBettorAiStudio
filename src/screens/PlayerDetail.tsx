import React from "react";
import { ChevronLeft, Info, Sparkles, User } from "lucide-react";
import { MetricBox } from "../components/MetricBox";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PlayerProp } from "../types";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { mapSupabaseRow } from "../lib/playerProps";

interface PlayerDetailProps {
  prop: PlayerProp;
  onBack: () => void;
}

interface ChartEntry {
  label: string;
  value: number;
  hit: boolean;
  isProjection: boolean;
  color: string;        // pre-computed fill — avoids recharts bool→string coercion
  opponent?: string;    // shown as tiny sub-label under x-axis tick if present
}

// Custom bar shape — handles regular bars (purple/red) and the NEXT projection bar.
// Uses pre-computed `color` string from data instead of a boolean to avoid the
// recharts boolean→string coercion bug where `hit: false` becomes "false" (truthy).
const GameBarShape = (props: any) => {
  const { x, y, width, height, color, isProjection } = props;
  if (!height || height <= 0) return null;
  if (isProjection) {
    return (
      <rect
        x={x} y={y} width={width} height={height}
        fill="rgba(168,85,247,0.4)"
        stroke="#A855F7" strokeWidth={1.5} strokeDasharray="4 2"
        rx={3}
      />
    );
  }
  return (
    <rect
      x={x} y={y} width={width} height={height}
      fill={color ?? "#EF4444"}
      rx={3}
    />
  );
};

// Custom X-axis tick — "NEXT" is bold and purple; shows opponent sub-label if present
const XAxisTick = ({ x, y, payload, data }: any) => {
  const isNext = payload.value === "NEXT";
  const entry: ChartEntry | undefined = (data ?? []).find(
    (d: ChartEntry) => d.label === payload.value
  );
  const opp = entry?.opponent;
  return (
    <g>
      <text
        x={x} y={y + 10}
        textAnchor="middle"
        fill={isNext ? "#A855F7" : "#64748b"}
        fontWeight={isNext ? "bold" : "normal"}
        fontSize={isNext ? 10 : 9}
      >
        {payload.value}
      </text>
      {opp && !isNext && (
        <text
          x={x} y={y + 20}
          textAnchor="middle"
          fill="#475569"
          fontSize={7}
        >
          {opp}
        </text>
      )}
    </g>
  );
};

export const PlayerDetail: React.FC<PlayerDetailProps> = ({ prop: initialProp, onBack }) => {
  const [prop, setProp] = React.useState<PlayerProp>(initialProp);
  const [loading, setLoading] = React.useState(false);

  // Fetch latest data for this specific player when the screen opens
  React.useEffect(() => {
    const fetchLatestData = async () => {
      if (!supabase) return;
      try {
        setLoading(true);
        const { data, error: sbError } = await supabase
          .from('AppData')
          .select('*')
          .eq('player_name', initialProp.player)
          .single();
        if (sbError) throw sbError;
        if (data) setProp(mapSupabaseRow(data, 0));
      } catch (err) {
        console.error("Failed to fetch real-time player data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestData();
  }, [initialProp.player]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "S": return "bg-[#7C3AED]";
      case "A": return "bg-[#22C55E]";
      case "B": return "bg-[#F59E0B]";
      default: return "bg-[#374151]";
    }
  };

  const edgeNum = Number(prop.newAlgoDiffNum ?? 0);
  const edgeDisplay = `${edgeNum >= 0 ? "+" : ""}${edgeNum.toFixed(1)}`;
  const projValue = prop.projPoints || prop.projection || prop.line;

  // Build chart data from last10Games + NEXT projection bar
  const gameEntries: ChartEntry[] = (prop.last10Games || []).map((val, i) => {
    const hit = prop.playType === "OVER" ? val >= prop.line : val <= prop.line;
    return {
      label: `G${i + 1}`,
      value: val,
      hit,
      color: hit ? "#22C55E" : "#EF4444",  // pre-computed so recharts can't coerce it
      isProjection: false,
    };
  });
  const projEntry: ChartEntry = {
    label: "NEXT",
    value: projValue,
    hit: false,
    color: "rgba(168,85,247,0.4)",
    isProjection: true,
  };
  const chartData: ChartEntry[] = [...gameEntries, projEntry];

  // Hit / miss / streak — only count non-zero games
  const validGames = gameEntries.filter((g) => g.value > 0);
  const hits = validGames.filter((g) => g.hit).length;
  const misses = validGames.filter((g) => !g.hit).length;
  let streak = 0;
  if (validGames.length > 0) {
    const lastDir = validGames[validGames.length - 1].hit;
    for (let i = validGames.length - 1; i >= 0; i--) {
      if (validGames[i].hit === lastDir) streak++;
      else break;
    }
  }
  const streakIsHit = validGames.length > 0 && validGames[validGames.length - 1].hit;

  // Y-axis domain: ceil to next multiple of 5, with 20% headroom
  const allValues = chartData.map((d) => d.value).concat([prop.line, projValue]);
  const yMax = Math.ceil((Math.max(...allValues) * 1.2) / 5) * 5;
  const yTicks = Array.from({ length: Math.floor(yMax / 5) + 1 }, (_, i) => i * 5);

  // ChartTooltip defined inside component to close over prop and edgeNum
  const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d: ChartEntry = payload[0].payload;
    return (
      <div className="bg-[#0F1629] border border-white/15 rounded-lg px-3 py-2 text-left">
        {d.isProjection ? (
          <>
            <p className="text-white font-bold text-[12px]">Next Game Projection</p>
            <p className="text-[#A855F7] text-[11px]">AI Proj: {d.value} PTS</p>
            <p className="text-slate-400 text-[11px]">Book Line: {prop.line}</p>
            <p className={cn("text-[11px] font-semibold", edgeNum >= 0 ? "text-emerald-400" : "text-red-400")}>
              Edge: {edgeDisplay} pts
            </p>
          </>
        ) : (
          <>
            <p className="text-white font-bold text-[12px]">{d.label} — {d.value} PTS</p>
            <p className={cn("text-[11px] font-semibold", d.hit ? "text-[#A855F7]" : "text-[#EF4444]")}>
              {d.hit ? "✅ HIT" : "❌ MISS"} — Line was {prop.line}
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-24 px-5 pt-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-[#0F1629] rounded-full border border-white/8 shrink-0">
          <ChevronLeft size={24} className="text-text-primary" />
        </button>

        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full border-2 border-accent bg-[#080D1A] flex items-center justify-center overflow-hidden shrink-0">
            <User size={32} className="text-text-muted" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-bold text-white leading-tight">
                {prop.player}
              </h1>
              <div className={cn(
                "px-[10px] py-[3px] rounded-full text-[11px] font-bold uppercase text-white",
                getTierColor(prop.tier)
              )}>
                Tier {prop.tier}
              </div>
            </div>
            <span className="text-[12px] text-text-secondary mt-0.5">
              {prop.matchup}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Stats 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        {/* Box 1 - Book Line */}
        <div className="bg-[#0F1629] border border-white/8 rounded-2xl p-4">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">Book Line</p>
          <p className="text-[18px] font-bold text-white mt-1">
            {prop.playType}
          </p>
          <p className="text-[22px] font-bold text-white leading-tight">
            {prop.line} pts
          </p>
        </div>

        {/* Box 2 - AI Projection */}
        <div className="bg-[#0F1629] border border-purple-500/20 rounded-2xl p-4">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">AI Proj</p>
          <p className="text-[28px] font-bold mt-1 bg-gradient-to-b from-purple-300 to-purple-600 bg-clip-text text-transparent leading-tight">
            {projValue}
          </p>
          <p className="text-[11px] text-slate-500">pts</p>
        </div>

        {/* Box 3 - Edge */}
        <div className="bg-[#0F1629] border border-white/8 rounded-2xl p-4">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">Edge</p>
          <p className={cn(
            "text-[24px] font-bold mt-1 leading-tight",
            edgeNum >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {edgeDisplay}
          </p>
          <p className="text-[11px] text-slate-500">pts vs line</p>
        </div>

        {/* Box 4 - Confidence */}
        <div className="bg-[#0F1629] border border-white/8 rounded-2xl p-4">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">Confidence</p>
          <p className={cn(
            "text-[28px] font-bold mt-1 leading-tight",
            prop.confidence >= 75 ? "text-emerald-400" :
            prop.confidence >= 50 ? "text-amber-400" : "text-slate-400"
          )}>
            {prop.confidence}%
          </p>
          <div className="mt-1 h-[3px] w-full rounded-full bg-white/10 relative overflow-hidden">
            {prop.confidence > 0 && (
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-emerald-400 relative z-10"
                style={{ width: `${prop.confidence}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Last 10 Games Chart */}
      <div className="px-4 relative">
        {loading && (
          <div className="absolute inset-0 z-20 bg-canvas/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-2 bg-[#0F1629] border border-white/10 px-4 py-2 rounded-full shadow-xl">
              <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing…</span>
            </div>
          </div>
        )}

        <div className="bg-[#0F1629] rounded-2xl border border-white/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">
            Last 10 Games vs Line
          </p>

          {/* Summary pills */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 rounded-xl py-2.5 flex flex-col items-center bg-[#22C55E]/15 border border-[#22C55E]/30">
              <span className="text-[18px] font-bold text-[#22C55E] leading-tight">{hits}</span>
              <span className="text-[9px] uppercase tracking-widest text-[#22C55E]/70">Hits</span>
            </div>
            <div className="flex-1 rounded-xl py-2.5 flex flex-col items-center bg-[#EF4444]/15 border border-[#EF4444]/30">
              <span className="text-[18px] font-bold text-[#EF4444] leading-tight">{misses}</span>
              <span className="text-[9px] uppercase tracking-widest text-[#EF4444]/70">Misses</span>
            </div>
            <div className={cn(
              "flex-1 rounded-xl py-2.5 flex flex-col items-center border",
              streak === 0
                ? "bg-white/5 border-white/10"
                : streakIsHit
                  ? "bg-[#22C55E]/15 border-[#22C55E]/30"
                  : "bg-[#EF4444]/15 border-[#EF4444]/30"
            )}>
              <span className={cn(
                "text-[15px] font-bold leading-tight",
                streak === 0 ? "text-slate-500"
                  : streakIsHit ? "text-[#22C55E]" : "text-[#EF4444]"
              )}>
                {streak > 0 ? `${streakIsHit ? "🔥" : "❄️"} ${streak}${streakIsHit ? "W" : "L"}` : "—"}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-white/40">Streak</span>
            </div>
          </div>

          {/* Recharts bar chart */}
          <ResponsiveContainer width="100%" height={180}>
            <ReBarChart data={chartData} barCategoryGap="18%" margin={{ top: 5, right: 44, bottom: 0, left: -8 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={<XAxisTick data={chartData} />}
                axisLine={false}
                tickLine={false}
                height={28}
              />
              <YAxis
                domain={[0, yMax]}
                ticks={yTicks}
                tick={{ fill: "#64748b", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              {/* Book line — dashed white */}
              <ReferenceLine
                y={prop.line}
                stroke="rgba(255,255,255,0.7)"
                strokeDasharray="4 3"
                label={{ value: `LINE ${prop.line}`, position: "insideTopRight", fill: "#94a3b8", fontSize: 8 }}
              />
              {/* AI projection — dashed purple (only show if different from line) */}
              {projValue !== prop.line && (
                <ReferenceLine
                  y={projValue}
                  stroke="rgba(168,85,247,0.8)"
                  strokeDasharray="4 3"
                  label={{ value: `PROJ ${projValue}`, position: "insideBottomRight", fill: "#A855F7", fontSize: 8 }}
                />
              )}
              <Bar dataKey="value" shape={<GameBarShape />} maxBarSize={24} />
            </ReBarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 px-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm bg-[#22C55E] inline-block" /> Hit
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm bg-[#EF4444] inline-block" /> Miss
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm bg-[#A855F7]/40 border border-[#A855F7] inline-block" /> Next
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bg-[#0F1629] rounded-[16px] p-4 grid grid-cols-2 gap-6 border border-white/8 mx-4">
        <div className="flex flex-col gap-4">
          <span className="label-text">Performance</span>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="caption-text">Algo Record</span>
              <span className="body-text font-bold">{prop.algoRecord}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="caption-text">Model Record</span>
              <span className="body-text font-bold text-positive">{prop.modelRecord}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="caption-text">Hit Rate L10</span>
              <span className="body-text font-bold text-positive">{prop.hitRateDisplay}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="label-text">Model Quality</span>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="caption-text">Blend Score</span>
                <span className="caption-text font-bold">{Math.round(prop.algoModelBlend)}</span>
              </div>
              <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-positive transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, prop.algoModelBlend))}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="caption-text">Bias Score</span>
                <Info size={10} className="text-text-muted" />
              </div>
              <span className="body-text font-bold">{prop.biasScore.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="caption-text">Model Agreement</span>
              <span className="body-text font-bold">{(prop as any).allAgree}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Pill */}
      <div className="bg-[#0F1629] border border-white/8 rounded-[12px] p-4 flex items-center gap-2 mx-4">
        <p className="body-text text-text-primary">
          Gone <span className="text-positive font-bold">{prop.playType}</span> the {prop.line}{" "}
          {(prop.propType || "PTS").toLowerCase()} line in {Math.round((prop.hitRateL10 || 0) / 10)} of their
          last 10 games · Tier {prop.tier} · {prop.confidence}% Confidence
        </p>
      </div>

      {/* AI Summary Card */}
      <div className="bg-[#130B2E] border border-purple-500/20 border-l-[4px] border-l-[#A855F7] rounded-[16px] p-5 relative overflow-hidden flex flex-col gap-3 mx-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B4B] to-[#131829] opacity-40 pointer-events-none" />
        <span className="label-text text-[#A855F7] flex items-center gap-2">
          <Sparkles size={14} />
          AI SUMMARY
        </span>
        <p className="body-text text-text-secondary relative z-10">
          Going <span className="text-white font-semibold">{prop.playType}</span>{" "}
          {prop.line} {(prop.propType || "PTS").toLowerCase()} with{" "}
          <span className="text-[#A855F7] font-semibold">
            {projValue} pts
          </span>{" "}
          projected.{" "}
          <span className="text-white font-semibold">{prop.confidence}%</span> confidence,{" "}
          <span className="text-white font-semibold">{prop.probHit}%</span> probability to hit.
          Edge:{" "}
          <span className={cn(
            "font-semibold",
            edgeNum >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {edgeDisplay} pts
          </span>
          .
        </p>
        <div className="flex items-center gap-1 mt-1">
          <span className="caption-text text-[9px]">Powered by BetterBettor AI</span>
          <Sparkles size={10} className="text-[#A855F7]" />
        </div>
      </div>
    </div>
  );
};
