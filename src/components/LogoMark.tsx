import React from "react";
import { cn } from "../lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ size = 48, className }) => {
  const borderRadius = size * 0.22;
  const fontSize = size * 0.45;
  const strokeWidth = (size / 48) * 4.5;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden shadow-md border-[3px] border-white",
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: "#8B35C4",
        borderRadius: borderRadius,
      }}
    >
      {/* Chart Line (Background) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>
        <polyline
          points="0,60 40,85 100,20"
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth * (100 / size)}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />
      </svg>

      {/* Text (Foreground) */}
      <span
        className="absolute top-[10%] left-[12%] font-black text-white leading-none select-none"
        style={{
          fontSize: fontSize,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
        }}
      >
        B3
      </span>
    </div>
  );
};
