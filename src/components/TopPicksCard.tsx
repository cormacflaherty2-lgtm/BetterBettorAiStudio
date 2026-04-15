import React from "react";
import { PlayerProp } from "../types";
import { cn } from "../lib/utils";

interface TopPicksCardProps {
  prop: PlayerProp;
  onClick: (prop: PlayerProp) => void;
  rank?: number;
}

const TIER_ACCENT: Record<string, string> = {
  S: "#A855F7",
  A: "#22C55E",
  B: "#F59E0B",
  C: "#374151",
  D: "#374151",
};

const TIER_BADGE: Record<string, string> = {
  S: "bg-[#7C3AED] text-white",
  A: "bg-[#22C55E] text-black",
  B: "bg-[#F59E0B] text-black",
  C: "bg-[#374151] text-white",
  D: "bg-[#374151] text-white",
};

export const TopPicksCard: React.FC<TopPicksCardProps> = ({ prop, onClick }) => {
  const accentColor = TIER_ACCENT[prop.tier ?? "C"] ?? TIER_ACCENT.C;
  const tierBadge = TIER_BADGE[prop.tier ?? "C"] ?? "bg-[#374151] text-white";

  return (
    <div
      onClick={() => onClick(prop)}
      className="bg-[#0F1629] rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Tier accent bar */}
      <div style={{ height: "2.5px", backgroundColor: accentColor }} />

      {/* Body */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Name + tier badge */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[15px] font-bold text-white truncate">
              {prop.playerName ?? "Unknown"}
            </span>
            <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0", tierBadge)}>
              {prop.tier}
            </span>
          </div>

          {/* Matchup */}
          <p className="text-[11px] text-white/40 mb-2.5">{prop.matchup}</p>

          {/* 3 data columns */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/30 uppercase tracking-wider">Line</span>
              <span className="text-[12px] font-semibold text-white">{prop.line}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/30 uppercase tracking-wider">Conf</span>
              <span className="text-[12px] font-semibold text-white">{prop.confidence}%</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/30 uppercase tracking-wider">Edge</span>
              <span className="text-[12px] font-semibold" style={{ color: accentColor }}>
                {prop.newAlgoDif || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: circular projection badge + OVER/UNDER chip */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            className="w-[58px] h-[58px] rounded-full flex items-center justify-center"
            style={{ border: `2px solid ${accentColor}` }}
          >
            <span
              className="text-[18px] font-bold leading-none"
              style={{ color: accentColor }}
            >
              {prop.projPoints || prop.line}
            </span>
          </div>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold",
              prop.playType === "OVER" ? "bg-[#22C55E] text-white" : "bg-[#EF4444] text-white"
            )}
          >
            {prop.playType}
          </span>
        </div>
      </div>
    </div>
  );
};
