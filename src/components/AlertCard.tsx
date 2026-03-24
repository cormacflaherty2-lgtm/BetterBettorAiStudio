import React, { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Alert } from "../types";
import { cn } from "../lib/utils";

interface AlertCardProps {
  alert: Alert;
  onDelete: (id: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const getBorderColor = () => {
    switch (alert.type) {
      case "alert": return "border-l-[#F59E0B]";
      case "hit": return "border-l-[#22C55E]";
      case "miss": return "border-l-[#EF4444]";
      case "system": return "border-l-slate-500";
      default: return "border-l-slate-500";
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(alert.id);
    }, 300);
  };

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div
          layout
          initial={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="relative w-full overflow-hidden rounded-[16px]"
        >
          {/* Delete Button Background (Revealed on swipe) */}
          <div className="absolute inset-0 bg-[#EF4444] flex justify-end items-center px-6">
            <span className="text-white font-bold body-text">Delete</span>
          </div>

          <motion.div
            drag="x"
            dragConstraints={{ left: -100, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) {
                handleDelete();
              }
            }}
            className={cn(
              "relative w-full p-4 bg-[#0F1629] border border-[rgba(168,85,247,0.15)] border-l-[4px] flex flex-col gap-1 transition-all duration-200 cursor-grab active:cursor-grabbing",
              getBorderColor()
            )}
          >
            <div className="flex justify-between items-start">
              <span className="text-[14px] font-bold text-white leading-tight pr-6">
                {alert.title}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex justify-between items-end gap-4">
              <span className="text-[12px] text-slate-400 line-clamp-2 flex-1">
                {alert.description}
              </span>
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                {alert.timestamp}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
