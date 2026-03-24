import React, { useState } from "react";
import { Bell } from "lucide-react";
import { AlertCard } from "../components/AlertCard";
import { MOCK_ALERTS } from "../mockData";
import { cn } from "../lib/utils";
import { AnimatePresence, motion } from "motion/react";

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Alerts", "Hits", "Misses", "System"];

  const handleDelete = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Alerts") return alert.type === "alert";
    if (activeFilter === "Hits") return alert.type === "hit";
    if (activeFilter === "Misses") return alert.type === "miss";
    if (activeFilter === "System") return alert.type === "system";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 pb-24 px-5 pt-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="display-text text-text-primary">Notifications</h1>
        <button 
          onClick={markAllRead}
          className="text-accent body-text font-semibold"
        >
          Mark all read
        </button>
      </header>

      {/* Filter Pills */}
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-5 py-2 rounded-full transition-all duration-200 shrink-0 body-text font-medium",
              activeFilter === filter 
                ? "bg-accent text-white" 
                : "bg-transparent text-slate-400 border border-slate-700"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="flex flex-col gap-3 min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onDelete={handleDelete} 
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3"
            >
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-500">
                <Bell size={32} />
              </div>
              <span className="text-[14px] text-slate-500 font-medium">No notifications</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
