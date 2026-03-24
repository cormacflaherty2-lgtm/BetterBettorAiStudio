import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { cn } from "../lib/utils";

const prices = {
  weekly: { price: "$4.99", period: "/wk" },
  monthly: { price: "$14.99", period: "/mo" },
  yearly: { price: "$99.99", period: "/yr" }
};

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { setIsPro } = useAppContext();
  const [activePlan, setActivePlan] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [isFading, setIsFading] = useState(false);

  const setPlan = (plan: "weekly" | "monthly" | "yearly") => {
    if (plan === activePlan) return;
    setIsFading(true);
    setTimeout(() => {
      setActivePlan(plan);
      setIsFading(false);
    }, 200);
  };

  const handleStartWinning = () => {
    setIsPro(true);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans flex justify-center overflow-x-hidden">
      <div className="w-full max-w-[480px] bg-background relative pb-10 overflow-hidden">
        {/* Glow Orbs */}
        <div className="absolute w-[300px] h-[300px] bg-[radial-gradient(circle,#7C3AED,transparent_70%)] top-[-100px] left-1/2 -translate-x-1/2 blur-[80px] opacity-40 z-0 pointer-events-none"></div>
        <div className="absolute w-[250px] h-[250px] bg-[radial-gradient(circle,#8B5CF6,transparent_70%)] bottom-[-50px] right-[-50px] blur-[80px] opacity-20 z-0 pointer-events-none"></div>

        <div className="relative z-10 px-5 py-6 flex flex-col gap-6">
          <header className="text-center mt-5 mb-2.5">
            <h1 className="text-[28px] font-bold tracking-tight mb-2 text-white">
              Unlock Your Edge
            </h1>
            <p className="text-[14px] text-text-secondary leading-relaxed">
              Join thousands of bettors using AI to beat the books.
            </p>
          </header>

          {/* Toggle Container */}
          <div className="bg-white/5 rounded-full p-1 grid grid-cols-3 relative border border-white/10 mb-2.5">
            <div 
              className="absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(33.33%-5px)] bg-white/10 rounded-full transition-transform duration-300 z-10 shadow-lg border border-white/10"
              style={{ transform: `translateX(${activePlan === "weekly" ? 0 : activePlan === "monthly" ? 100 : 200}%)` }}
            ></div>
            <button 
              onClick={() => setPlan("weekly")}
              className={cn(
                "py-2 text-center text-[13px] font-medium transition-colors z-20",
                activePlan === "weekly" ? "text-white" : "text-text-secondary"
              )}
            >
              Weekly
            </button>
            <button 
              onClick={() => setPlan("monthly")}
              className={cn(
                "py-2 text-center text-[13px] font-medium transition-colors z-20",
                activePlan === "monthly" ? "text-white" : "text-text-secondary"
              )}
            >
              Monthly
            </button>
            <button 
              onClick={() => setPlan("yearly")}
              className={cn(
                "py-2 text-center text-[13px] font-medium transition-colors z-20",
                activePlan === "yearly" ? "text-white" : "text-text-secondary"
              )}
            >
              Yearly
              <span className="text-[9px] text-purple-mid font-bold ml-1 uppercase">-45%</span>
            </button>
          </div>

          {/* Card Stack */}
          <div className="flex flex-col gap-4">
            {/* Free Card */}
            <div className="bg-white/5 rounded-[20px] p-6 relative border border-white/5 transition-all">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="text-[15px] font-bold mb-1 text-white">Free</div>
                  <div className="text-[24px] font-bold tracking-tight flex items-baseline text-white">
                    $0<span className="text-[13px] text-text-secondary font-normal ml-1">/forever</span>
                  </div>
                </div>
              </div>
              <ul className="flex flex-col gap-3 mb-6">
                <FeatureItem text="Basic Odds Comparison" />
                <FeatureItem text="Daily Match Schedules" />
                <FeatureItem text="Community Access" />
              </ul>
              <button className="w-full py-3 rounded-[14px] border border-white/10 text-white font-bold text-[14px] text-center">
                Current Plan
              </button>
            </div>

            {/* Pro Card */}
            <div className="bg-white/5 rounded-[20px] p-6 relative border border-purple-mid/30 shadow-[0_0_30px_rgba(139,92,246,0.1)] transition-all">
              <div className="absolute top-0 right-0 bg-purple-mid text-white text-[10px] font-black px-3 py-1.5 rounded-bl-[12px] uppercase tracking-widest">
                Most Popular
              </div>
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="text-[15px] font-bold mb-1 text-white">Pro Access</div>
                  <div className={cn("text-[24px] font-bold tracking-tight flex items-baseline transition-opacity duration-200 text-white", isFading ? "opacity-0" : "opacity-100")}>
                    {prices[activePlan].price}
                    <span className="text-[13px] text-text-secondary font-normal ml-1">{prices[activePlan].period}</span>
                  </div>
                </div>
              </div>
              <ul className="flex flex-col gap-3 mb-6">
                <FeatureItem text="AI Best Picks & Predictions" highlight />
                <FeatureItem text="Unlimited Player Props" />
                <FeatureItem text="Performance Tracking" />
                <FeatureItem text="Advanced Parlay Builder" />
              </ul>
              <button 
                onClick={handleStartWinning}
                className="w-full py-3 rounded-[14px] gradient-purple text-white font-bold text-[14px] text-center shadow-[0_4px_20px_rgba(139,92,246,0.4)] active:scale-[0.98] transition-all"
              >
                Start Winning
              </button>
            </div>
          </div>

          <p className="text-center text-text-tertiary text-[11px] mt-2.5 uppercase tracking-widest font-bold">
            Cancel anytime. Secure payment.
          </p>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ text: string; highlight?: boolean }> = ({ text, highlight }) => (
  <li className="flex items-center gap-3 text-[14px] text-[#d4d4d8] leading-relaxed">
    <div className={cn(
      "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
      highlight ? "bg-gradient-to-br from-[#7B2FBE] to-[#A855F7]" : "bg-white/10"
    )}>
      <svg className="w-3 h-3 stroke-white stroke-[2.5] fill-none" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <span className={cn(highlight && "text-white font-medium")}>{text}</span>
  </li>
);
