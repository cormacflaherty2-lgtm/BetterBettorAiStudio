import React, { useState, useEffect } from "react";
import { Home } from "./screens/Home";
import { PlayerDetail } from "./screens/PlayerDetail";
import { AIBestPicks } from "./screens/AIBestPicks";
import { Alerts } from "./screens/Alerts";
import { Profile } from "./screens/Profile";
import { BottomNav } from "./components/BottomNav";
import { PlayerProp } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { MOCK_PROPS } from "./mockData";
import { usePlayerProps } from "./hooks/usePlayerProps";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProp, setSelectedProp] = useState<PlayerProp | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(4);
  const [activeSheet, setActiveSheet] = useState("MasterRanking");
  const { players, loading, lastUpdated, refresh, error } = usePlayerProps(activeSheet);

  // Verify in render:
  console.log('Rendering with players:', players.length);

  // Handle back button on Player Detail
  const handleBack = () => {
    setSelectedProp(null);
  };

  // Handle prop selection
  const handlePropClick = (prop: PlayerProp) => {
    setSelectedProp(prop);
  };

  // Reset selected prop when switching tabs
  useEffect(() => {
    setSelectedProp(null);
    if (activeTab === "alerts") {
      setUnreadAlerts(0);
    }
  }, [activeTab]);

  const renderScreen = () => {
    if (selectedProp) {
      return (
        <motion.div
          key="player-detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <PlayerDetail prop={selectedProp} onBack={handleBack} />
        </motion.div>
      );
    }

    if (error && players.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center gap-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-xl font-bold text-white">Data Connection Failed</h2>
          <p className="text-slate-400 text-sm">
            {error}. Please check your Supabase credentials in the environment settings.
          </p>
          <button 
            onClick={refresh}
            className="px-8 py-3 bg-accent text-white font-bold rounded-xl active:scale-95 transition-transform"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Home
              onPropClick={handlePropClick}
              unreadCount={unreadAlerts}
              playerProps={players}
              lastUpdated={lastUpdated}
              onRefresh={refresh}
              loading={loading}
              error={error}
              onNavigateToNotifications={() => setActiveTab("alerts")}
              activeSheet={activeSheet}
              onSheetChange={setActiveSheet}
            />
          </motion.div>
        );
      case "picks":
        return (
          <motion.div
            key="picks"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AIBestPicks onPropClick={handlePropClick} playerProps={players} />
          </motion.div>
        );
      case "alerts":
        return (
          <motion.div
            key="alerts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Alerts />
          </motion.div>
        );
      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Profile />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col max-w-[390px] mx-auto relative overflow-x-hidden">
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </main>

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unreadAlerts={unreadAlerts} 
      />
    </div>
  );
};

export default App;
