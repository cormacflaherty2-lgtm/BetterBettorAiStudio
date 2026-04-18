import React, { useState, useMemo } from "react";
import { Bell, Search, X } from "lucide-react";
import { PlayerCard } from "../components/PlayerCard";
import { PropTypeDropdown } from "../components/PropTypeDropdown";
import { PlayerProp } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface HomeProps {
  onPropClick: (prop: PlayerProp) => void;
  unreadCount: number;
  playerProps: PlayerProp[];
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
  onNavigateToNotifications: () => void;
  activeSheet: string;
  onSheetChange: (sheet: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  onPropClick,
  unreadCount,
  playerProps,
  lastUpdated,
  onRefresh,
  loading,
  error,
  onNavigateToNotifications,
  activeSheet,
  onSheetChange
}) => {
  const [activeCategory, setActiveCategory] = useState("All Props");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [playTypeFilter, setPlayTypeFilter] = useState<"ALL" | "OVER" | "UNDER">("ALL");
  const [sortMode, setSortMode] = useState<"TOP SCORE" | "TOP EDGE">("TOP SCORE");

  const categories = ["All Props", "AI Best Picks", "Popular Picks"];

  const TIER_PRIORITY: Record<string, number> = {
    "S": 0,
    "A": 1,
    "B": 2,
    "C": 3,
    "D": 4
  };

  const filteredAndSortedProps = useMemo(() => {
    let filtered = [...playerProps];

    // Category filter
    if (activeCategory === "AI Best Picks") {
      filtered = filtered.filter(p => p.tier === "S" || p.tier === "A");
    } else if (activeCategory === "Popular Picks") {
      filtered = filtered.filter(p => {
        const conf = p.confidence > 1 ? p.confidence : p.confidence * 100;
        return conf > 70;
      });
    }

    // Play type filter
    if (playTypeFilter !== "ALL") {
      filtered = filtered.filter(p => p.playType === playTypeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.player.toLowerCase().includes(query) ||
        p.team.toLowerCase().includes(query)
      );
    }

    // Sort
    return filtered.sort((a, b) => {
      if (sortMode === "TOP EDGE") {
        const ea = Number(a.edge ?? a.newAlgoDiffNum ?? a.diff ?? 0);
        const eb = Number(b.edge ?? b.newAlgoDiffNum ?? b.diff ?? 0);
        return eb - ea;
      }
      if (sortMode === "TOP SCORE") {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      // Default: tier → diff
      const tierA = TIER_PRIORITY[a.tier] ?? 99;
      const tierB = TIER_PRIORITY[b.tier] ?? 99;
      if (tierA !== tierB) return tierA - tierB;
      return b.diff - a.diff;
    });
  }, [playerProps, searchQuery, activeCategory, playTypeFilter, sortMode]);

  const PropCardSkeleton = () => (
    <div className="bg-[#0F1629] border border-purple-500/15 rounded-2xl p-4 mb-3 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-900/40 shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-28 bg-purple-900/40 rounded" />
            <div className="h-2.5 w-16 bg-purple-900/20 rounded" />
          </div>
        </div>
        <div className="h-6 w-14 bg-purple-900/40 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <div className="h-2 w-12 bg-purple-900/20 rounded" />
          <div className="h-3.5 w-16 bg-purple-900/40 rounded" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-2 w-10 bg-purple-900/20 rounded" />
          <div className="h-3.5 w-14 bg-purple-900/40 rounded" />
        </div>
        <div className="flex flex-col gap-1 items-end">
          <div className="h-2 w-8 bg-purple-900/20 rounded" />
          <div className="h-3.5 w-12 bg-purple-900/40 rounded" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="h-2 w-16 bg-purple-900/20 rounded" />
          <div className="h-2.5 w-8 bg-purple-900/20 rounded" />
        </div>
        <div className="h-[3px] w-full rounded-full bg-purple-900/20" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <header className="flex flex-col pt-4">
        <div className="flex items-center justify-between px-5 mb-2">
          <div className="flex flex-col">
            <h1 className="display-text text-accent">BetterBettor</h1>
            <span className="text-[10px] text-slate-500">
              Updated {lastUpdated?.toLocaleTimeString() ?? 'Loading...'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn(
                "w-10 h-10 flex items-center justify-center bg-[#0F1629] rounded-full border border-white/8 text-slate-400 transition-colors",
                isSearchOpen && "text-accent border-accent/50"
              )}
            >
              <Search size={18} />
            </button>
            <button 
              onClick={onNavigateToNotifications}
              className="relative w-10 h-10 flex items-center justify-center bg-[#0F1629] rounded-full border border-white/8"
            >
              <Bell size={20} className="text-text-primary" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 bg-negative text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#080D1A]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden px-5"
            >
              <div className="relative mb-4">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search players, teams, props..."
                  className="w-full h-12 bg-[#0F1629] border border-white/10 focus:border-accent rounded-xl px-4 pr-10 text-white placeholder:text-slate-500 outline-none transition-all"
                />
                <button 
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Category Filters (Sort Pills) */}
      <div className="flex items-center gap-3 px-5 overflow-x-auto hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full transition-all duration-200 shrink-0 body-text font-medium",
              activeCategory === cat ? "bg-accent text-white" : "bg-transparent text-text-muted border border-transparent"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Play Type Filter + Sort Toggle */}
      <div className="flex items-center justify-between px-5 gap-3">
        {/* OVER / UNDER pills */}
        <div className="flex items-center gap-2">
          {(["ALL", "OVER", "UNDER"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPlayTypeFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0",
                playTypeFilter === f
                  ? f === "OVER"
                    ? "bg-[#22C55E] text-white"
                    : f === "UNDER"
                    ? "bg-[#EF4444] text-white"
                    : "bg-accent text-white"
                  : "bg-transparent text-text-muted border border-white/10"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <div className="flex items-center bg-[#0F1629] border border-white/8 rounded-full p-0.5 shrink-0">
          {(["TOP SCORE", "TOP EDGE"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                sortMode === mode
                  ? "bg-accent text-white"
                  : "text-white/40"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 🔥 TOP PICKS TODAY banner */}
      {playerProps.length > 0 && (
        <div className="px-5 flex flex-col gap-2">
          <p className="text-[12px] font-bold uppercase tracking-[1.2px] text-[#A855F7]">
            🔥 Top Picks Today
          </p>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {[...playerProps]
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .slice(0, 5)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPropClick(p)}
                  className="shrink-0 w-[140px] h-[90px] rounded-xl p-3 flex flex-col justify-between active:scale-95 transition-transform"
                  style={{ background: "#0D0D1A", border: "1px solid rgba(168,85,247,0.2)" }}
                >
                  <div className="flex justify-between items-start gap-1">
                    <p className="text-[13px] font-bold text-white truncate leading-tight flex-1">
                      {p.playerName ?? p.player ?? "—"}
                    </p>
                    <span className="text-[9px] font-bold text-[#A855F7] bg-[rgba(168,85,247,0.15)] rounded-full px-1.5 py-0.5 shrink-0">
                      {Math.round(p.score ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[9px] font-bold uppercase rounded-full px-2 py-0.5"
                      style={{
                        color: p.playType === "OVER" ? "#34D399" : "#F87171",
                        backgroundColor: p.playType === "OVER" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                      }}
                    >
                      {p.playType ?? "—"}
                    </span>
                    <span className="text-[12px] font-semibold text-white/80">
                      {p.line ?? "—"}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Prop Type Dropdown */}
      <PropTypeDropdown activeSheet={activeSheet} onSheetChange={onSheetChange} />

      {/* Props Feed */}
      <div className="flex flex-col gap-3 px-5 min-h-[400px]">
        {loading ? (
          <>
            {/* Loading label with purple pulse */}
            <div className="flex items-center justify-center gap-2 py-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-pulse" />
              <span className="text-[12px] text-[#A855F7]/70 animate-pulse">
                Loading today's props...
              </span>
            </div>
            <PropCardSkeleton />
            <PropCardSkeleton />
            <PropCardSkeleton />
          </>
        ) : error && playerProps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="body-text text-white/30">Unable to load players</p>
            <button
              onClick={onRefresh}
              className="px-6 py-2 rounded-[20px] border border-[#A855F7] text-[#A855F7] font-medium text-sm active:scale-95 transition-transform"
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedProps.length > 0 ? (
          filteredAndSortedProps.map((prop) => (
            <PlayerCard key={prop.id} prop={prop} onClick={onPropClick} />
          ))
        ) : (searchQuery.trim() || activeCategory !== "All Props") ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="body-text">No props match your filters</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl">🏀</span>
            <p className="text-[14px] text-white/40">No props available right now</p>
          </div>
        )}
      </div>
    </div>
  );
};
