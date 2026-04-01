import React, { useState, useMemo } from "react";
import { Bell, Search, X } from "lucide-react";
import { PlayerCard } from "../components/PlayerCard";
import { PropTypeDropdown } from "../components/PropTypeDropdown";
import { MOCK_PROPS } from "../mockData";
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
  onNavigateToNotifications,
  activeSheet,
  onSheetChange
}) => {
  const [activeCategory, setActiveCategory] = useState("All Props");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      filtered = filtered.filter(p => p.confidence >= 70);
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
      const tierA = TIER_PRIORITY[a.tier] ?? 99;
      const tierB = TIER_PRIORITY[b.tier] ?? 99;
      if (tierA !== tierB) return tierA - tierB;
      return b.diff - a.diff;
    });
  }, [playerProps, searchQuery, activeCategory]);

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

      {/* Prop Type Dropdown */}
      <PropTypeDropdown activeSheet={activeSheet} onSheetChange={onSheetChange} />

      {/* Props Feed */}
      <div className="flex flex-col gap-3 px-5 min-h-[400px]">
        {loading ? (
          <>
            <PropCardSkeleton />
            <PropCardSkeleton />
            <PropCardSkeleton />
          </>
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
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="body-text">No players available right now</p>
            <p className="text-[12px] text-slate-600 mt-1">Check back before game time</p>
          </div>
        )}
      </div>
    </div>
  );
};
