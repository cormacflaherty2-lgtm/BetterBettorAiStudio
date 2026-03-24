import React from "react";
import { cn } from "../lib/utils";

interface FilterPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const FilterPill: React.FC<FilterPillProps> = ({ label, active, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap",
        active 
          ? "gradient-purple text-white shadow-md" 
          : "bg-white/5 text-text-secondary hover:bg-white/10 border border-white/5",
        className
      )}
    >
      {label}
    </button>
  );
};
