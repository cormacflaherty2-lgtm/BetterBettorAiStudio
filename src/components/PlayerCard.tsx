import React from "react";
import { PlayerProp } from "../types";
import { cn } from "../lib/utils";

interface PlayerCardProps {
  prop: PlayerProp;
  onClick: (prop: PlayerProp) => void;
}

const BORDER_GRADIENT: Record<string, string> = {
  S: "linear-gradient(135deg, rgba(168,85,247,0.6), rgba(168,85,247,0.1) 45%, transparent)",
  A: "linear-gradient(135deg, rgba(34,197,94,0.6), rgba(34,197,94,0.1) 45%, transparent)",
  B: "linear-gradient(135deg, rgba(245,158,11,0.6), rgba(245,158,11,0.1) 45%, transparent)",
};

const TIER_BADGE: Record<string, string> = {
  S: "bg-[#7C3AED] text-white",
  A: "bg-[#22C55E] text-black",
  B: "bg-[#F59E0B] text-black",
  C: "bg-[#374151] text-white",
  D: "bg-[#374151] text-white",
};

/** Parse "W-L" record string → hit rate. Returns null if record is empty or unparseable. */
function parseRecord(record: string): { pct: number; total: number } | null {
  const m = (record ?? "").match(/^(\d+)-(\d+)$/);
  if (!m) return null;
  const wins = parseInt(m[1], 10);
  const losses = parseInt(m[2], 10);
  const total = wins + losses;
  return total > 0 ? { pct: Math.round((wins / total) * 100), total } : null;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ prop, onClick }) => {
  const confidence = Math.min(100, Math.max(0, prop.confidence ?? 0));
  const probHit = prop.probHit ?? 0;
  const newAlgoDiffNum = Number(prop.newAlgoDiffNum ?? 0);
  const edgeSign = newAlgoDiffNum >= 0 ? "+" : "";
  const edgeDisplay = `${edgeSign}${newAlgoDiffNum.toFixed(1)}`;

  // Hit rate pill — try algoRecord/modelRecord, fall back to probHit
  const recordData = parseRecord(prop.algoRecord || prop.modelRecord || "");
  const hitRatePct = recordData ? recordData.pct : probHit;
  const hitRateLabel = recordData
    ? `${hitRatePct}% L${recordData.total}`
    : hitRatePct > 0
    ? `${hitRatePct}%`
    : null;
  const hitRateGood = hitRatePct > 55;

  // Hit / Miss detection (Supabase returns uppercase "HIT" / "MISS")
  const normalised = (prop.hitMiss ?? "").toUpperCase();
  const isHit = normalised === "HIT";
  const isMiss = normalised === "MISS";

  // Border + glow based on last result
  const borderGradient =
    BORDER_GRADIENT[prop.tier ?? "C"] ??
    "linear-gradient(135deg, rgba(168,85,247,0.6), rgba(168,85,247,0.1) 45%, transparent)";
  const tierBadge = TIER_BADGE[prop.tier ?? "C"] ?? "bg-[#374151] text-white";
  const glowShadow = isHit
    ? "0 0 16px 2px rgba(34,197,94,0.35)"
    : isMiss
    ? "0 0 16px 2px rgba(239,68,68,0.35)"
    : undefined;

  // Edge badge (Task 3 — shows on cards when edge > 3)
  const edgeRaw = Number(prop.edge ?? prop.newAlgoDiffNum ?? 0);
  const showEdgeBadge = edgeRaw > 3;

  return (
    <div
      onClick={() => onClick(prop)}
      style={{
        background: borderGradient,
        padding: "1px",
        borderRadius: "20px",
        boxShadow: glowShadow,
      }}
      className="mb-3 active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="bg-[#080D1A] rounded-[19px] p-4 flex flex-col gap-3">

        {/* ── TOP ROW ── */}
        <div className="flex items-start gap-2">
          {/* Left: name + team + thin confidence bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-[17px] font-bold text-white leading-tight truncate">
                {prop.playerName ?? "Unknown Player"}
              </p>
              {isHit && <span className="shrink-0 text-[13px]">✅</span>}
              {isMiss && <span className="shrink-0 text-[13px]">❌</span>}
            </div>
            <p className="text-[12px] text-white/45 mt-0.5 truncate">
              {prop.team ?? ""}{prop.opponent ? ` vs ${prop.opponent}` : ""}
            </p>
            {/* Thin confidence bar directly under player name */}
            <div className="mt-2 h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#A855F7]"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Right: tier badge + hit rate pill + edge badge */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold", tierBadge)}>
              {prop.tier}
            </span>
            {hitRateLabel && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                hitRateGood
                  ? "bg-[#22C55E]/20 text-[#22C55E]"
                  : "bg-[#EF4444]/20 text-[#EF4444]"
              )}>
                {hitRateLabel}
              </span>
            )}
            {showEdgeBadge && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#A855F7]/20 text-[#A855F7]">
                +{edgeRaw.toFixed(1)} EDGE
              </span>
            )}
          </div>
        </div>

        {/* ── TWO-COLUMN INNER PANEL ── */}
        <div
          className="rounded-xl p-3 grid grid-cols-2 gap-2"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {/* Left: AI Projected */}
          <div className="flex flex-col">
            <p className="text-[10px] text-white/40 mb-0.5">AI Projected</p>
            <p className="text-[30px] font-bold leading-none text-[#A855F7]">
              {prop.projPoints || "—"}
            </p>
          </div>
          {/* Right: OVER/UNDER + Book Line */}
          <div className="flex flex-col items-end">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-bold mb-1",
              prop.playType === "OVER" ? "bg-[#22C55E] text-white" : "bg-[#EF4444] text-white"
            )}>
              {prop.playType}
            </span>
            <p className="text-[28px] font-bold text-white leading-none">{prop.line ?? "—"}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Book Line</p>
          </div>
        </div>

        {/* LINE → PROJ summary row */}
        {(prop.line ?? 0) > 0 && (prop.projPoints ?? 0) > 0 && (
          <p className="text-[10px] text-white/35 text-center -mt-1">
            LINE {prop.line} → PROJ {prop.projPoints}
          </p>
        )}

        {/* ── CONFIDENCE BAR (labelled) ── */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] text-white/50">Confidence</span>
            <span className="text-[11px] font-semibold text-white/80">{confidence} / 100</span>
          </div>
          <div className="h-[5px] w-full rounded-full bg-white/10 relative overflow-hidden">
            <div
              className="h-full rounded-full absolute top-0 left-0"
              style={{
                width: `${confidence}%`,
                background: "linear-gradient(to right, #7C3AED, #A855F7, #22C55E)",
              }}
            />
            {/* Tick marks */}
            <div className="absolute top-0 bottom-0 w-[1px] bg-white/50 z-10" style={{ left: "50%" }} />
            <div className="absolute top-0 bottom-0 w-[1px] bg-white/50 z-10" style={{ left: "75%" }} />
          </div>
          <p className="text-center text-[11px] text-white/60 mt-1.5">Edge {edgeDisplay} pts</p>
        </div>

        {/* ── FOOTER: Prob Hit + Last 5 ── */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-lg p-2.5 flex flex-col items-center"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <p className="text-[10px] text-white/40">Prob Hit</p>
            <p className="text-[14px] font-bold text-white mt-0.5">{probHit}%</p>
          </div>
          <div
            className="rounded-lg p-2.5 flex flex-col items-center"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <p className="text-[10px] text-white/40">Last 5</p>
            <p className="text-[14px] font-bold text-white mt-0.5">{prop.hitMiss || "—"}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
