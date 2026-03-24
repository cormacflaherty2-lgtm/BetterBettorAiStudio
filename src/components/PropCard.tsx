import React from "react";
import { PlayerProp } from "../types";
import { cn } from "../lib/utils";

interface PropCardProps {
  prop: PlayerProp;
  onClick: (prop: PlayerProp) => void;
  rank?: number;
}

export const PropCard: React.FC<PropCardProps> = ({ prop, onClick, rank }) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "S": return "bg-[#F59E0B]";
      case "A": return "bg-[#8B5CF6]";
      case "B": return "bg-[#3B82F6]";
      default: return "bg-[#374151]";
    }
  };

  const diff = prop.projection - prop.line;
  const confidence = prop.confidence;

  return (
    <div 
      onClick={() => onClick(prop)}
      className="bg-[#0F1629] border border-purple-500/15 rounded-2xl p-4 mb-3 active:scale-[0.98] transition-transform cursor-pointer"
    >
      {/* Zone 1 — Player header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0">
            <span className="text-[14px] font-bold text-white">{prop.playerInitials}</span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold text-white truncate max-w-[160px]">
                {prop.playerName}
              </h3>
            </div>
            <span className="text-[11px] text-[#64748B]">
              {prop.matchup}
            </span>
          </div>
        </div>

        {/* Tier Badge */}
        <div className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase text-white shrink-0",
          getTierColor(prop.tier)
        )}>
          Tier {prop.tier}
        </div>
      </div>

      {/* Zone 2 — Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Column 1 — Book Line */}
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-500">Book Line</p>
          <p className="text-[13px] font-semibold text-white mt-0.5">
            {prop.playType} {prop.line} {prop.propType.toLowerCase()}
          </p>
        </div>

        {/* Column 2 — AI Projection */}
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-500">AI Proj</p>
          <p className="text-[15px] font-bold mt-0.5 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            {prop.projection} pts
          </p>
        </div>

        {/* Column 3 — Edge */}
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">Edge</p>
          <p className={cn(
            "text-[15px] font-bold mt-0.5 flex items-center justify-end gap-0.5",
            diff > 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {diff > 0 ? "↑" : "↓"} {prop.edge}
          </p>
        </div>
      </div>

      {/* Zone 3 — Confidence bar */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] uppercase tracking-widest text-slate-500">Confidence</span>
          <span className={cn(
            "text-[11px] font-semibold",
            confidence >= 75 ? "text-emerald-400" :
            confidence >= 50 ? "text-amber-400" : "text-slate-400"
          )}>
            {confidence}%
          </span>
        </div>
        <div className="h-[3px] w-full rounded-full bg-white/10 relative overflow-hidden">
          {/* Ticks */}
          <div className="absolute inset-0 flex justify-between px-[10%] pointer-events-none">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white/10" />
            ))}
          </div>
          {confidence > 0 && (
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500 relative z-10"
              style={{ width: `${confidence}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
