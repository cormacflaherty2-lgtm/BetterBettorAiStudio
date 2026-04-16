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

  // Hit / Miss detection
  const normalised = (prop.hitMiss ?? "").toUpperCase();
  const isHit = normalised === "HIT";
  const isMiss = normalised === "MISS";

  // Border gradient + glow
  const borderGradient =
    BORDER_GRADIENT[prop.tier ?? "C"] ??
    "linear-gradient(135deg, rgba(168,85,247,0.6), rgba(168,85,247,0.1) 45%, transparent)";
  const tierBadge = TIER_BADGE[prop.tier ?? "C"] ?? "bg-[#374151] text-white";
  const glowShadow = isHit
    ? "0 0 16px 2px rgba(34,197,94,0.3)"
    : isMiss
    ? "0 0 16px 2px rgba(239,68,68,0.3)"
    : undefined;

  // Edge badge — shows when edge > 3
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
      className="mb-[10px] active:scale-[0.97] transition-transform duration-150 ease-out cursor-pointer"
    >
      {/* Inner card */}
      <div
        className="rounded-[19px] flex flex-col"
        style={{
          background: "#0D0D1A",
          border: "1px solid rgba(168,85,247,0.15)",
          padding: "14px",
          gap: "10px",
        }}
      >

        {/* ── TOP ROW ── */}
        <div className="flex items-start gap-2">
          {/* Left: name, matchup, thin confidence bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p
                className="font-bold text-white truncate"
                style={{ fontSize: "18px", letterSpacing: "-0.3px", lineHeight: 1.2 }}
              >
                {prop.playerName ?? "Unknown Player"}
              </p>
              {isHit  && <span className="shrink-0 text-[13px]">✅</span>}
              {isMiss && <span className="shrink-0 text-[13px]">❌</span>}
            </div>
            <p
              className="font-normal truncate"
              style={{
                fontSize: "12px",
                letterSpacing: "0.2px",
                marginTop: "2px",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {prop.team ?? ""}{prop.opponent ? ` vs ${prop.opponent}` : ""}
            </p>
            {/* Thin confidence indicator */}
            <div
              className="rounded-full overflow-hidden"
              style={{ marginTop: "8px", height: "3px", backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full bg-[#A855F7]"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Right: tier badge + hit rate pill + edge badge */}
          <div className="flex flex-col items-end shrink-0" style={{ gap: "4px" }}>
            <span
              className={cn("rounded-full font-bold uppercase", tierBadge)}
              style={{ fontSize: "10px", letterSpacing: "1.2px", padding: "2px 8px" }}
            >
              {prop.tier}
            </span>
            {hitRateLabel && (
              <span
                className={cn(
                  "rounded-full font-bold uppercase",
                  hitRateGood
                    ? "bg-[#22C55E]/20 text-[#22C55E]"
                    : "bg-[#EF4444]/20 text-[#EF4444]"
                )}
                style={{ fontSize: "11px", letterSpacing: "0.8px", padding: "2px 8px" }}
              >
                {hitRateLabel}
              </span>
            )}
            {showEdgeBadge && (
              <span
                className="rounded-full font-bold uppercase text-[#C084FC]"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.8px",
                  padding: "2px 8px",
                  backgroundColor: "rgba(168,85,247,0.15)",
                }}
              >
                +{edgeRaw.toFixed(1)} EDGE
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />

        {/* ── TWO-COLUMN INNER PANEL ── */}
        <div
          className="rounded-xl grid grid-cols-2"
          style={{ background: "rgba(255,255,255,0.03)", padding: "12px", gap: "8px" }}
        >
          {/* Left: AI Projected */}
          <div className="flex flex-col">
            <p
              className="font-bold uppercase"
              style={{ fontSize: "10px", letterSpacing: "1.2px", color: "rgba(255,255,255,0.45)", marginBottom: "2px" }}
            >
              AI Projected
            </p>
            <p className="text-[28px] font-bold leading-none text-[#A855F7]">
              {prop.projPoints || "—"}
            </p>
          </div>
          {/* Right: OVER/UNDER + Book Line */}
          <div className="flex flex-col items-end">
            <span
              className="rounded-full font-bold uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "1.2px",
                padding: "2px 8px",
                marginBottom: "4px",
                color: prop.playType === "OVER" ? "#34D399" : "#F87171",
                backgroundColor: prop.playType === "OVER"
                  ? "rgba(52,211,153,0.15)"
                  : "rgba(248,113,113,0.15)",
              }}
            >
              {prop.playType}
            </span>
            <p className="text-[26px] font-bold text-white leading-none">{prop.line ?? "—"}</p>
            <p
              className="font-bold uppercase"
              style={{ fontSize: "10px", letterSpacing: "1.2px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}
            >
              Book Line
            </p>
          </div>
        </div>

        {/* LINE → PROJ single-line row */}
        {(prop.line ?? 0) > 0 && (prop.projPoints ?? 0) > 0 && (
          <div className="flex items-center justify-center" style={{ gap: "6px" }}>
            <span
              className="font-bold uppercase"
              style={{ fontSize: "10px", letterSpacing: "1.2px", color: "rgba(255,255,255,0.4)" }}
            >
              LINE
            </span>
            <span
              className="font-semibold"
              style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)" }}
            >
              {prop.line}
            </span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>→</span>
            <span
              className="font-bold uppercase"
              style={{ fontSize: "10px", letterSpacing: "1.2px", color: "rgba(255,255,255,0.4)" }}
            >
              PROJ
            </span>
            <span
              className="font-semibold text-[#A855F7]"
              style={{ fontSize: "13px" }}
            >
              {prop.projPoints}
            </span>
          </div>
        )}

        {/* Divider before confidence */}
        <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />

        {/* ── CONFIDENCE BAR (labelled) ── */}
        <div className="flex flex-col" style={{ gap: "6px" }}>
          <div className="flex justify-between items-center">
            <span
              className="font-bold uppercase"
              style={{ fontSize: "10px", letterSpacing: "1.2px", color: "rgba(255,255,255,0.5)" }}
            >
              Confidence
            </span>
            <span
              className="font-medium"
              style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}
            >
              {confidence} / 100
            </span>
          </div>
          <div
            className="rounded-full relative overflow-hidden"
            style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full absolute top-0 left-0 bg-[#A855F7]"
              style={{ width: `${confidence}%` }}
            />
            <div className="absolute top-0 bottom-0 w-[1px] bg-white/40 z-10" style={{ left: "50%" }} />
            <div className="absolute top-0 bottom-0 w-[1px] bg-white/40 z-10" style={{ left: "75%" }} />
          </div>
          <p
            className="text-center font-medium"
            style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}
          >
            Edge {edgeDisplay} pts
          </p>
        </div>

        {/* ── FOOTER: Prob Hit + Last 5 ── */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-lg flex flex-col items-center"
            style={{ background: "rgba(255,255,255,0.03)", padding: "10px" }}
          >
            <p
              className="font-bold uppercase"
              style={{ fontSize: "10px", letterSpacing: "1.2px", color: "rgba(255,255,255,0.45)" }}
            >
              Prob Hit
            </p>
            <p className="text-[14px] font-bold text-white mt-0.5">{probHit}%</p>
          </div>
          <div
            className="rounded-lg flex flex-col items-center"
            style={{ background: "rgba(255,255,255,0.03)", padding: "10px" }}
          >
            <p
              className="font-bold uppercase"
              style={{ fontSize: "10px", letterSpacing: "1.2px", color: "rgba(255,255,255,0.45)" }}
            >
              Last 5
            </p>
            <p className="text-[14px] font-bold text-white mt-0.5">{prop.hitMiss || "—"}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
