import React, { useState } from "react";
import { Info } from "lucide-react";
import { TopPicksCard } from "../components/TopPicksCard";
import { MOCK_PROPS } from "../mockData";
import { PlayerProp } from "../types";
import { cn } from "../lib/utils";

interface AIBestPicksProps {
  onPropClick: (prop: PlayerProp) => void;
  playerProps: PlayerProp[];
}

export const AIBestPicks: React.FC<AIBestPicksProps> = ({ onPropClick, playerProps }) => {
  const [activeFilter, setActiveFilter] = useState("Top Picks");
  const [showModal, setShowModal] = useState(false);

  const TIER_PRIORITY: Record<string, number> = {
    "S": 0,
    "A": 1,
    "B": 2,
    "C": 3,
    "D": 4
  };

  const filteredProps = playerProps.filter(p => p.tier === "S" || p.tier === "A");

  const sortedProps = [...filteredProps].sort((a, b) => {
    if (activeFilter === "Top Picks") {
      const tierA = TIER_PRIORITY[a.tier] ?? 99;
      const tierB = TIER_PRIORITY[b.tier] ?? 99;
      if (tierA !== tierB) return tierA - tierB;
      return b.diff - a.diff;
    }
    if (activeFilter === "High Edge") {
      return b.diff - a.diff;
    }
    return b.confidence - a.confidence;
  });

  return (
    <div className="flex flex-col gap-6 pb-24 px-5 pt-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="title-text text-text-primary">AI Best Picks</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-accent caption-text font-bold"
        >
          <Info size={14} />
          How we rank
        </button>
      </header>

      {/* Filter Pills */}
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveFilter("Top Picks")}
          className={cn(
            "px-4 py-2 rounded-full transition-all duration-200 shrink-0 body-text font-medium",
            activeFilter === "Top Picks" 
              ? "bg-accent text-white" 
              : "bg-transparent text-text-muted border border-white/10"
          )}
        >
          Top Picks
        </button>
        <button
          onClick={() => setActiveFilter("High Edge")}
          className={cn(
            "px-4 py-2 rounded-full transition-all duration-200 shrink-0 body-text font-medium",
            activeFilter === "High Edge" 
              ? "border border-slate-500 text-slate-300" 
              : "bg-transparent text-text-muted border border-white/10"
          )}
        >
          High Edge
        </button>
        <button
          onClick={() => setActiveFilter("High Confidence")}
          className={cn(
            "px-4 py-2 rounded-full transition-all duration-200 shrink-0 body-text font-medium",
            activeFilter === "High Confidence" 
              ? "border border-slate-500 text-slate-300" 
              : "bg-transparent text-text-muted border border-white/10"
          )}
        >
          High Confidence
        </button>
      </div>

      {/* Ranked List */}
      <div className="flex flex-col gap-4">
        {sortedProps.map((prop, idx) => (
          <TopPicksCard
            key={prop.id}
            prop={prop}
            onClick={onPropClick}
            rank={idx + 1}
          />
        ))}
        {sortedProps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted text-center">
            <p className="body-text">No Tier S or A picks available right now.</p>
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal Mockup */}
      {showModal && (
        <div className="fixed inset-0 bg-[#080D1A]/80 backdrop-blur-sm z-[100] flex items-end">
          <div className="w-full bg-[#0F1629] rounded-t-[24px] p-8 border-t border-white/8 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-[#1C2240] rounded-full self-center" />
            <h2 className="title-text text-text-primary">How we rank picks</h2>
            <p className="body-text text-text-secondary">
              Our AI model evaluates thousands of data points including player performance, team defense, injury reports, and betting market trends. Picks are ranked based on a combination of Edge (difference between AI projection and book line) and Confidence (model's certainty in the outcome).
            </p>
            <button 
              onClick={() => setShowModal(false)}
              className="w-full py-4 bg-accent text-white font-bold rounded-[12px] active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
