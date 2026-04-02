import React from "react";
import { ChevronLeft, Info, Sparkles, User } from "lucide-react";
import { MetricBox } from "../components/MetricBox";
import { BarChart } from "../components/BarChart";
import { PlayerProp, GameStat } from "../types";
import { MOCK_GAME_STATS } from "../mockData";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { mapSupabaseRow } from "../lib/playerProps";

interface PlayerDetailProps {
  prop: PlayerProp;
  onBack: () => void;
}

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
      case "S": return "bg-[#F59E0B]";
      case "A": return "bg-[#8B5CF6]";
      case "B": return "bg-[#3B82F6]";
      default: return "bg-[#374151]";
    }
  };

  // Transform last10Games into GameStat array for the chart
  const chartStats: GameStat[] = [
    ...(prop.last10Games || []).map((val, i) => ({
      date: `G${10 - i}`,
      value: val,
      opponent: "",
    })),
    {
      date: "PROJ",
      value: prop.projectedPts,
      opponent: "",
      isProjection: true,
    }
  ];

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
            {prop.projection}
          </p>
          <p className="text-[11px] text-slate-500">pts</p>
        </div>

        {/* Box 3 - Edge */}
        <div className="bg-[#0F1629] border border-white/8 rounded-2xl p-4">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">Edge</p>
          <p className={`text-[24px] font-bold mt-1 leading-tight
            ${prop.projection - prop.line > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {prop.edge}
          </p>
          <p className="text-[11px] text-slate-500">pts vs line</p>
        </div>

        {/* Box 4 - Confidence */}
        <div className="bg-[#0F1629] border border-white/8 rounded-2xl p-4">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">Confidence</p>
          <p className={`text-[28px] font-bold mt-1 leading-tight
            ${prop.confidence >= 75 ? 'text-emerald-400' :
              prop.confidence >= 50 ? 'text-amber-400' : 'text-slate-400'}`}>
            {prop.confidence}%
          </p>
          <div className="mt-1 h-[3px] w-full rounded-full bg-white/10 relative overflow-hidden">
            {/* Ticks */}
            <div className="absolute inset-0 flex justify-between px-[10%] pointer-events-none">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-[1px] h-full bg-white/10" />
              ))}
            </div>
            {prop.confidence > 0 && (
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-emerald-400 relative z-10"
                style={{ width: `${prop.confidence}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="px-4 relative">
        {loading && (
          <div className="absolute inset-0 z-20 bg-canvas/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-2 bg-[#0F1629] border border-white/10 px-4 py-2 rounded-full shadow-xl">
              <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Sheet...</span>
            </div>
          </div>
        )}
        <BarChart stats={chartStats} line={prop.line} playType={prop.playType} />
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
          Gone <span className="text-positive font-bold">{prop.playType}</span> the {prop.line} {(prop.propType || "PTS").toLowerCase()} line in {Math.round((prop.hitRateL10 || 0) / 10)} of their last 10 games · Tier {prop.tier} · {prop.confidence}% Confidence
        </p>
      </div>

      {/* AI Insight Card */}
      <div className="bg-[#0F1629] border border-purple-500/15 border-l-[4px] border-l-accent rounded-[16px] p-5 relative overflow-hidden flex flex-col gap-3 mx-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B4B] to-[#131829] opacity-40 pointer-events-none" />
        <span className="label-text text-accent flex items-center gap-2">
          <Sparkles size={14} />
          AI INSIGHT
        </span>
        <p className="body-text text-text-secondary relative z-10">
          LeBron has been aggressive in the paint recently, averaging 12.4 points in the restricted area over the last 5 games. The Knicks' interior defense has struggled against high-usage forwards, allowing 52 points per game in the paint. Expect LeBron to clear this line early.
        </p>
        <div className="flex items-center gap-1 mt-2">
          <span className="caption-text text-[9px]">Powered by Gemini</span>
          <Sparkles size={10} className="text-accent" />
        </div>
      </div>
    </div>
  );
};
