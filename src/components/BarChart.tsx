import React, { useState } from "react";
import { GameStat } from "../types";
import { cn } from "../lib/utils";

interface BarChartProps {
  stats: GameStat[];
  line: number;
  playType: "OVER" | "UNDER";
}

export const BarChart: React.FC<BarChartProps> = ({ stats, line, playType }) => {
  const [selectedGame, setSelectedGame] = useState<{
    label: string;
    pts: number;
    index: number;
    hit: boolean;
    isProjection: boolean;
  } | null>(null);

  // Step A — Validate data before passing to the chart
  const safeChartData = stats.map(entry => ({
    ...entry,
    // Force pts to a valid number
    pts: (entry.value === null || entry.value === undefined || isNaN(Number(entry.value)))
      ? 0
      : Number(entry.value),
    label: entry.date,
  }));

  const projectedPts = safeChartData.find(d => d.isProjection)?.pts || 0;

  return (
    <div 
      className="w-full px-1"
      onClick={(e) => {
        // Only clear if clicking the container itself, not a bar
        if (e.target === e.currentTarget) {
          setSelectedGame(null);
        }
      }}
    >
      {/* Bars container */}
      <div className="flex items-end gap-[3px] h-[140px] w-full relative">
        {/* Line indicator overlay */}
        <div 
          className="absolute left-0 right-0 border-t border-dashed border-white z-10 pointer-events-none"
          style={{ 
            bottom: `${(line / Math.max(...safeChartData.map(d => d.pts || 0), line, 1)) * 100}%` 
          }}
        >
          <span className="absolute right-0 -top-4 text-[11px] text-slate-500 font-medium">
            Line: {line}
          </span>
        </div>

        {safeChartData.map((entry, index) => {
          const maxVal = Math.max(...safeChartData.map(d => d.pts || 0), line, 1);
          const heightPct = entry.pts ? (entry.pts / maxVal) * 100 : 2;
          const isSelected = selectedGame?.index === index;

          const hit = playType === 'OVER'
            ? entry.pts >= line
            : entry.pts <= line;

          let barColor = '#8B5CF6'; // purple for PROJ
          if (!entry.isProjection && entry.pts > 0) {
            barColor = hit ? '#22C55E' : '#EF4444';
          }

          return (
            <div 
              key={index} 
              className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
              onClick={() => {
                // Toggle off if already selected
                if (isSelected) {
                  setSelectedGame(null);
                } else {
                  setSelectedGame({
                    label: entry.label,
                    pts: entry.pts,
                    index,
                    hit: entry.isProjection ? false : hit,
                    isProjection: !!entry.isProjection,
                  });
                }
              }}
            >
              {/* Point value label — shows above bar on select */}
              {isSelected && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white whitespace-nowrap bg-[#1E293B] px-1.5 py-0.5 rounded-md z-10">
                  {entry.pts}
                </span>
              )}

              {/* Bar */}
              <div
                className={cn(
                  "rounded-t-sm transition-all duration-200",
                  entry.isProjection ? "w-[70%]" : "w-full"
                )}
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: barColor,
                  minHeight: entry.pts > 0 ? '4px' : '0px',
                  opacity: entry.isProjection ? 0.85 : 1,
                  // Brighten selected bar, dim all others when one is selected
                  filter: selectedGame
                    ? isSelected
                      ? 'brightness(1.3)'
                      : 'brightness(0.45)'
                    : 'brightness(1)',
                  transform: isSelected ? 'scaleY(1.04)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                  outline: isSelected ? `2px solid ${barColor}` : 'none',
                  outlineOffset: '1px',
                  borderRadius: isSelected ? '3px 3px 0 0' : '2px 2px 0 0',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-[3px] mt-1.5">
        {safeChartData.map((entry, index) => (
          <div key={index} className="flex-1 text-center">
            <span className={`text-[8px] ${entry.isProjection ? 'text-purple-400 font-semibold' : 'text-slate-500'}`}>
              {entry.label}
            </span>
          </div>
        ))}
      </div>

      {/* Game Detail Popup Card */}
      {selectedGame && (
        <div className="mt-3 rounded-2xl bg-[#0F1629] border border-purple-500/20 p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {selectedGame.isProjection ? (
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wide">
                  ✨ Tonight's AI Projection
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  {selectedGame.label} Performance
                </span>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedGame(null)}
              className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:bg-white/20 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Points scored / projected */}
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                {selectedGame.isProjection ? 'AI Projection' : 'Points Scored'}
              </p>
              <p className={`text-[22px] font-bold leading-none
                ${selectedGame.isProjection
                  ? 'bg-gradient-to-b from-purple-300 to-purple-600 bg-clip-text text-transparent'
                  : 'text-white'}`}>
                {selectedGame.pts}
              </p>
            </div>

            {/* Book line for context */}
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Prop Line</p>
              <p className="text-[22px] font-bold text-white leading-none">{line}</p>
            </div>

            {/* Hit / Miss / Projection result */}
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Result</p>
              {selectedGame.isProjection ? (
                <p className="text-[13px] font-bold text-purple-400 leading-none mt-1">Pending</p>
              ) : (
                <p className={`text-[18px] font-bold leading-none mt-1
                  ${selectedGame.hit ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedGame.hit ? '✅ Hit' : '❌ Miss'}
                </p>
              )}
            </div>
          </div>

          {/* Difference from line */}
          {!selectedGame.isProjection && (
            <div className="mt-3 flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
              <span className="text-[11px] text-slate-400">Points vs Line</span>
              <span className={`text-[13px] font-bold
                ${selectedGame.pts - line >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {selectedGame.pts - line >= 0 ? '+' : ''}
                {(selectedGame.pts - line).toFixed(1)} pts
              </span>
            </div>
          )}

          {/* Projection context */}
          {selectedGame.isProjection && (
            <div className="mt-3 flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2.5">
              <span className="text-[11px] text-slate-400">Projected Edge</span>
              <span className={`text-[13px] font-bold
                ${projectedPts - line >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {projectedPts - line >= 0 ? '+' : ''}
                {(projectedPts - line).toFixed(1)} pts
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tap hint */}
      {!selectedGame && (
        <p className="text-center text-[10px] text-slate-600 mt-2 italic">
          Tap any bar to see game details
        </p>
      )}

      {/* Legend row */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block"/>Hit
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-red-400 inline-block"/>Miss
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-purple-400 inline-block"/>Proj
          </span>
        </div>
      </div>
    </div>
  );
};
