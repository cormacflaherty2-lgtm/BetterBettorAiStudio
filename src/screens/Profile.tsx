import React from "react";
import { Settings, Shield, CreditCard, Smartphone, ChevronRight, LogOut } from "lucide-react";
import { cn } from "../lib/utils";

export const Profile: React.FC = () => {
  const menuItems = [
    { icon: Settings, label: "Account Settings" },
    { icon: Shield, label: "Privacy & Security" },
    { icon: CreditCard, label: "Subscription Management" },
    { icon: Smartphone, label: "App Preferences" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-24 px-5 pt-4">
      {/* Header */}
      <header>
        <h1 className="title-text text-text-primary">Profile</h1>
      </header>

      {/* User Info Card */}
      <div className="bg-[#0F1629] rounded-[16px] p-6 flex flex-col items-center gap-4 border border-white/8">
        <div className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-accent to-[#8B5CF6] flex items-center justify-center text-white font-bold text-xl">
          CF
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="title-text text-text-primary">Cormac Flaherty</h2>
          <span className="body-text text-text-secondary">cormacflaherty2@gmail.com</span>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-accent/20 blur-md rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative px-4 py-1.5 bg-gradient-to-r from-accent to-[#F59E0B] rounded-full text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
            PRO MEMBER
            <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Picks Followed", value: "24" },
          { label: "Win Rate", value: "68%" },
          { label: "Streak", value: "5W" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0F1629] rounded-[12px] p-3 flex flex-col items-center gap-1 border border-white/8">
            <span className="caption-text text-[9px] text-center uppercase tracking-wider">{stat.label}</span>
            <span className="body-text font-bold text-text-primary">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Settings Menu */}
      <div className="flex flex-col">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={cn(
                "h-[52px] flex items-center justify-between px-2 transition-all duration-200 active:bg-[#1C2240] rounded-lg",
                idx !== menuItems.length - 1 && "border-b border-white/8"
              )}
            >
              <div className="flex items-center gap-4">
                <Icon size={20} className="text-text-muted" />
                <span className="body-text text-text-primary">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </button>
          );
        })}
      </div>

      {/* Sign Out */}
      <button className="flex items-center justify-center gap-2 py-4 text-negative font-bold body-text active:scale-[0.98] transition-all">
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
};
