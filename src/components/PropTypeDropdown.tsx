import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface PropTypeOption {
  id: string;
  label: string;
  sheet: string;
  available: boolean;
}

interface PropTypeDropdownProps {
  activeSheet: string;
  onSheetChange: (sheet: string) => void;
}

export const PropTypeDropdown: React.FC<PropTypeDropdownProps> = ({ activeSheet, onSheetChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: PropTypeOption[] = [
    { id: "points", label: "Points", sheet: "MasterRanking", available: true },
    { id: "rebounds", label: "Rebounds", sheet: "Rebounds", available: false },
    { id: "pra", label: "PRA", sheet: "PRA", available: false },
    { id: "ra", label: "R+A", sheet: "R+A", available: false },
  ];

  const currentOption = options.find(opt => opt.sheet === activeSheet) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: PropTypeOption) => {
    if (option.available) {
      onSheetChange(option.sheet);
      setIsOpen(false);
    }
  };

  return (
    <div className="px-4 w-full relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-12 bg-[#0F1629] border border-accent/15 rounded-[16px] px-4 flex items-center justify-between transition-all",
          isOpen && "border-accent/40 ring-1 ring-accent/20"
        )}
      >
        <span className="text-sm font-bold text-white">{currentOption.label}</span>
        <ChevronDown 
          size={18} 
          className={cn("text-slate-500 transition-transform duration-200", isOpen && "rotate-180")} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-[calc(100%+8px)] left-4 right-4 bg-[#0F1629] border border-accent/15 rounded-[16px] overflow-hidden shadow-2xl shadow-black/50"
          >
            <div className="flex flex-col py-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  disabled={!option.available}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full h-12 px-4 flex items-center justify-between transition-colors",
                    option.available ? "hover:bg-white/5 active:bg-white/10" : "opacity-50 cursor-not-allowed",
                    option.sheet === activeSheet && "bg-accent/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 flex items-center justify-center">
                      {option.sheet === activeSheet && (
                        <Check size={16} className="text-accent" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      option.sheet === activeSheet ? "text-accent" : "text-white"
                    )}>
                      {option.label}
                    </span>
                  </div>
                  {!option.available && (
                    <span className="text-[9px] font-bold uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      SOON
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
