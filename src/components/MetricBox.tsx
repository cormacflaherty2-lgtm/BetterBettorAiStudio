import React from "react";
import { Info } from "lucide-react";
import { cn } from "../lib/utils";

interface MetricBoxProps {
  label: string;
  value: string | number;
  isPositive?: boolean;
  isNegative?: boolean;
  isRaised?: boolean;
  hasBorder?: boolean;
  icon?: React.ReactNode;
  progress?: number;
}

export const MetricBox: React.FC<MetricBoxProps> = ({
  label,
  value,
  isPositive,
  isNegative,
  isRaised,
  hasBorder,
  icon,
  progress,
}) => {
  return (
    <div
      className={cn(
        "flex-1 p-3 rounded-[12px] flex flex-col gap-2 relative transition-all duration-200",
        isRaised ? "bg-surface-raised" : "bg-surface",
        hasBorder && (isPositive ? "border-l-[3px] border-l-positive" : "border-l-[3px] border-l-negative")
      )}
    >
      <div className="flex items-center justify-between">
        <span className="label-text text-[10px]">{label}</span>
        <Info size={12} className="text-text-muted cursor-help" />
      </div>
      
      <div className="flex items-center gap-1">
        {icon}
        <span
          className={cn(
            "font-bold leading-tight",
            isPositive ? "text-positive title-text" : 
            isNegative ? "text-negative title-text" : 
            "text-text-primary body-text"
          )}
        >
          {value}
        </span>
      </div>

      {progress !== undefined && (
        <div className="relative w-8 h-8 self-end mt-auto">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-surface-raised"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * progress) / 100}
              className="text-accent transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
};
