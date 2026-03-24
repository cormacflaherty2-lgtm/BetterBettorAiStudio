import React from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-[100px]">
      <Outlet />
      <BottomNav hasUnread={true} />
    </div>
  );
};
