import React from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { PlayerProp } from "../types";
import { cn } from "../lib/utils";
import { Lock } from "lucide-react";

interface PlayerPropCardProps {
  prop: PlayerProp;
  isLocked?: boolean;
}

export const PlayerPropCard: React.FC<PlayerPropCardProps> = ({ prop, isLocked }) => {
  const initials = prop.player
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getTierColor = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'S': return 'bg-[#F59E0B] text-black'; // Gold
      case 'A': return 'bg-[#8B5CF6] text-white'; // Purple
      case 'B': return 'bg-[#3B82F6] text-white'; // Blue
      case 'C': return 'bg-[#64748B] text-white'; // Grey
      case 'D': return 'bg-[#52525B] text-white'; // Dark Grey
      default: return 'bg-surface text-text-tertiary';
    }
  };

  return (
    <div className="relative mb-3">
      <Link 
        to={isLocked ? "/pricing" : `/player/${encodeURIComponent(prop.player)}`}
        className="block bg-white/5 border border-border rounded-[20px] p-4 shadow-sm relative overflow-hidden active:scale-[0.99] transition-transform w-full"
      >
        <div className="flex items-start">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center text-white font-black text-[14px] mr-3 shrink-0 shadow-sm">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            {/* Row 1: Name and Tier */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[15px] font-semibold text-white truncate">{prop.player}</h3>
              <span className={cn(
                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                getTierColor(prop.tier)
              )}>
                Tier {prop.tier}
              </span>
            </div>

            {/* Row 2: Book Line and AI Projection */}
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Book Line</p>
                <p className="text-[14px] font-bold text-text-secondary uppercase">
                  {prop.playType} {prop.line} pts
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-1">AI Projection</p>
                <p className="text-[22px] font-bold text-gradient-purple leading-none">{prop.projectedPts} pts</p>
              </div>
            </div>

            {/* Row 3: Edge and Hit Rate */}
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <div className="flex items-center space-x-2">
                <p className={cn(
                  "text-[14px] font-bold",
                  prop.diff > 0 ? "text-success" : prop.diff < 0 ? "text-error" : "text-text-tertiary"
                )}>
                  {prop.edgeDisplay}
                </p>
                {prop.lastResult && (
                  <span className="text-[11px]">
                    {prop.lastResult === "Hit" ? "✅" : "❌"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-widest">L10 HR: {prop.hitRateDisplay}</p>
            </div>

            {/* Row 4: Confidence Bar */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Confidence</p>
                <p className={cn(
                  "text-[11px] font-bold",
                  prop.confidence >= 75 ? "text-[#22C55E]" : prop.confidence >= 50 ? "text-[#F59E0B]" : "text-[#94A3B8]"
                )}>
                  {prop.confidenceDisplay}
                </p>
              </div>
              <div className="w-full h-[4px] bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-purple rounded-full" 
                  style={{ width: `${prop.confidence}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[4px] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center text-white mb-2 shadow-lg">
              <Lock size={18} />
            </div>
            <h4 className="text-[15px] font-bold text-white mb-1">Unlock Pro</h4>
            <p className="text-[11px] text-text-secondary">Get unlimited access to all AI picks.</p>
          </div>
        )}
      </Link>
    </div>
  );
};
