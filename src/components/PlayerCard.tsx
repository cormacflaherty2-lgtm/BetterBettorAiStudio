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

export const PlayerCard: React.FC<PlayerCardProps> = ({ prop, onClick }) => {
  const confidence = prop.confidence ?? 0;
  const probHit = prop.probHit ?? 0;
  const newAlgoDiffNum = Number(prop.newAlgoDiffNum ?? 0);
  const edgeSign = newAlgoDiffNum >= 0 ? "+" : "";
  const edgeDisplay = `${edgeSign}${newAlgoDiffNum.toFixed(1)}`;

  const borderGradient =
    BORDER_GRADIENT[prop.tier ?? "C"] ??
    "linear-gradient(135deg, rgba(168,85,247,0.6), rgba(168,85,247,0.1) 45%, transparent)";
  const tierBadge = TIER_BADGE[prop.tier ?? "C"] ?? "bg-[#374151] text-white";

  return (
    <div
      onClick={() => onClick(prop)}
      style={{ background: borderGradient, padding: "1px", borderRadius: "20px" }}
      className="mb-3 active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="bg-[#080D1A] rounded-[19px] p-4 flex flex-col gap-3">
        {/* Top row */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[17px] font-bold text-white leading-tight">
              {prop.playerName ?? "Unknown Player"}
            </p>
            <p className="text-[12px] text-white/45 mt-0.5">
              {prop.team ?? ""} vs {prop.opponent ?? ""}
            </p>
          </div>
          <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0", tierBadge)}>
            {prop.tier}
          </span>
        </div>

        {/* Two-column inner panel */}
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
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-bold mb-1",
                prop.playType === "OVER"
                  ? "bg-[#22C55E] text-white"
                  : "bg-[#EF4444] text-white"
              )}
            >
              {prop.playType}
            </span>
            <p className="text-[28px] font-bold text-white leading-none">{prop.line ?? "—"}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Book Line</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-[11px] text-white/50">Confidence</span>
            <span className="text-[11px] font-semibold text-white/80">{confidence} / 100</span>
          </div>
          <div className="h-[5px] w-full rounded-full bg-white/10 relative">
            <div
              className="h-full rounded-full absolute top-0 left-0"
              style={{
                width: `${confidence}%`,
                background: "linear-gradient(to right, #7C3AED, #A855F7, #22C55E)",
              }}
            />
            {/* Tick at 50% */}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-white/50 z-10"
              style={{ left: "50%" }}
            />
            {/* Tick at 75% */}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-white/50 z-10"
              style={{ left: "75%" }}
            />
          </div>
          <p className="text-center text-[11px] text-white/60 mt-1.5">Edge {edgeDisplay} pts</p>
        </div>

        {/* Footer: Prob Hit + Last 5 */}
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
