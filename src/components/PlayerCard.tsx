import React from "react";
import { PlayerProp } from "../types";
import { cn } from "../lib/utils";

interface PlayerCardProps {
  prop: PlayerProp;
  onClick: (prop: PlayerProp) => void;
}

const TIER_BG: Record<string, string> = {
  S: "bg-[#7C3AED]",
  A: "bg-[#059669]",
  B: "bg-[#D97706]",
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ prop, onClick }) => {
  const { hitMiss } = prop;
  const confidence = prop.confidence ?? 0;
  const probHit = prop.probHit ?? 0;
  const newAlgoDif = prop.newAlgoDif || '—';
  const newAlgoDiffNum = Number(prop.newAlgoDiffNum ?? 0);

  const tierBg = TIER_BG[prop.tier ?? 'C'] ?? "bg-[#6B7280]";

  const confColor =
    confidence > 70 ? "text-[#22C55E]" :
    confidence >= 50 ? "text-[#F59E0B]" : "text-[#EF4444]";

  const edgeNumColor = newAlgoDiffNum >= 0 ? "text-[#22C55E]" : "text-[#EF4444]";
  const edgeNumDisplay = newAlgoDiffNum >= 0
    ? `+${newAlgoDiffNum.toFixed(1)}`
    : newAlgoDiffNum.toFixed(1);

  return (
    <div
      onClick={() => onClick(prop)}
      className="bg-[#0D1526] rounded-[20px] border border-white/7 p-4 mb-3 active:scale-[0.98] transition-transform cursor-pointer"
    >
      {/* TOP ROW */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[17px] font-bold text-white leading-tight">{prop.playerName ?? 'Unknown Player'}</p>
          <p className="text-[12px] text-white/45 mt-0.5">
            {prop.team ?? ''} vs {prop.opponent ?? ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white", tierBg)}>
            {prop.tier}
          </span>
          {hitMiss === "Hit" && (
            <span className="w-2 h-2 rounded-full bg-[#22C55E] ml-1.5" />
          )}
          {hitMiss === "Miss" && (
            <span className="w-2 h-2 rounded-full bg-[#EF4444] ml-1.5" />
          )}
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="text-center my-4">
        <p className="text-[11px] text-white/40 uppercase tracking-[1.5px]">
          {prop.propType || "POINTS"}
        </p>
        <p className="text-[38px] font-bold text-white leading-none mt-1">
          {prop.projPoints || prop.line}
        </p>
        <p className="text-[10px] text-white/35">PROJ</p>
        <p className="text-[14px] text-white/60 mt-1">Line: {prop.line ?? '—'}</p>

        {/* OVER / UNDER buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex-1 h-9 rounded-[18px] font-bold text-[13px] transition-colors",
              prop.playType === "OVER"
                ? "bg-[#22C55E] text-white"
                : "bg-transparent border border-white/20 text-white/40"
            )}
          >
            OVER
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex-1 h-9 rounded-[18px] font-bold text-[13px] transition-colors",
              prop.playType === "UNDER"
                ? "bg-[#EF4444] text-white"
                : "bg-transparent border border-white/20 text-white/40"
            )}
          >
            UNDER
          </button>
        </div>
      </div>

      {/* BOTTOM ROW — 3 stat blocks */}
      <div className="flex justify-between mt-4">
        {/* Confidence */}
        <div className="flex flex-col items-center gap-0.5">
          <span className={cn("text-[15px] font-bold", confColor)}>{confidence ?? 0}%</span>
          <span className="text-[10px] text-white/40">CONF</span>
        </div>

        {/* Prob Hit */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[15px] font-bold text-white">{probHit ?? 0}%</span>
          <span className="text-[10px] text-white/40">PROB HIT</span>
        </div>

        {/* Edge */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[15px] font-bold text-white">{newAlgoDif}</span>
          <span className={cn("text-[12px] font-medium", edgeNumColor)}>{edgeNumDisplay}</span>
          <span className="text-[10px] text-white/40">EDGE %</span>
        </div>
      </div>
    </div>
  );
};
