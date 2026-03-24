import React from "react";
import { Home, Star, Bell, User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadAlerts: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, unreadAlerts }) => {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "picks", label: "Top Picks", icon: Star },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#080D1A] border-t border-white/8 px-4 py-2 flex justify-between items-center z-50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex flex-col items-center justify-center min-w-[72px] h-12 transition-all duration-200"
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-accent/20 rounded-full h-8 top-1"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-accent" : "text-text-muted"
                  )}
                />
                {tab.id === "alerts" && unreadAlerts > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-negative text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#080D1A]">
                    {unreadAlerts}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-colors duration-200",
                  isActive ? "text-accent" : "text-text-muted"
                )}
              >
                {tab.label}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
};
