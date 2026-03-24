import React from "react";

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-3">
      {children}
    </div>
  );
};
