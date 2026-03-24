import React from "react";
import { cn } from "../lib/utils";
import { LucideIcon } from "lucide-react";

interface IconCircleProps {
  icon: LucideIcon;
  color: string;
  className?: string;
}

export const IconCircle: React.FC<IconCircleProps> = ({ icon: Icon, color, className }) => {
  return (
    <div 
      className={cn(
        "w-[44px] h-[44px] rounded-full flex items-center justify-center",
        className
      )}
      style={{ backgroundColor: color + "20" }} // 20 is hex for ~12% opacity
    >
      <Icon size={20} style={{ color }} />
    </div>
  );
};
