import React from "react";
import { cn } from "../lib/utils";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const GradientButton: React.FC<GradientButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={cn(
        "gradient-purple w-full h-[64px] rounded-[18px] text-white font-bold text-[18px] shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
