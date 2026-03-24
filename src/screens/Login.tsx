import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    setIsAuthenticated(true);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white flex justify-center items-center p-4">
      <div className="w-full max-w-[393px] h-[852px] bg-black relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(123,47,190,0.1)] border border-[#2A2A2A] rounded-[40px]">
        <div className="absolute inset-0 p-8 bg-[radial-gradient(circle_at_50%_0%,#1a0b2e_0%,#000000_60%)] flex flex-col">
          <div className="mt-10 mb-10">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <h1 className="text-[32px] font-bold mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-[#888888] text-[15px]">Log in to access your AI betting insights.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="form-group">
              <label className="block text-[12px] font-semibold text-[#888888] uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[56px] bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 text-[16px] focus:outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] transition-all"
                placeholder="name@example.com" 
              />
            </div>

            <div className="form-group">
              <label className="block text-[12px] font-semibold text-[#888888] uppercase tracking-wider mb-2 ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[56px] bg-[#111111] border border-[#2A2A2A] rounded-[12px] px-4 text-[16px] focus:outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] transition-all"
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit"
              className="w-full h-[56px] rounded-[12px] bg-gradient-to-br from-[#7B2FBE] to-[#C084FC] text-white font-bold text-[16px] shadow-[0_4px_15px_rgba(123,47,190,0.3)] active:scale-[0.98] transition-transform mt-6"
            >
              Log In
            </button>
          </form>

          <div className="flex items-center gap-4 my-8 text-[#444444] text-[12px] font-semibold uppercase">
            <div className="flex-1 h-[1px] bg-[#222222]"></div>
            <span>or continue with</span>
            <div className="flex-1 h-[1px] bg-[#222222]"></div>
          </div>

          <button className="w-full h-[56px] rounded-[12px] bg-white text-black font-bold text-[16px] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.96.95-2.44.8-4.02 0-1.56-.81-2.53-.82-4.18 0-1.61.82-3.08.99-4.22 0-3.12-2.73-3.15-8.23 0-11.4 1.34-1.35 3.12-2.11 4.7-2.11 1.63 0 2.54.55 3.51.55.95 0 2.21-.6 4.14-.6 1.83 0 3.66.86 4.84 2.38-3.69 1.94-3.1 7.23.56 8.78-.69 1.74-1.47 3.46-3.33 5.4H17.05zM12.03 7.25c-.02-2.23 1.76-4.07 3.9-4.25.19 2.25-1.95 4.38-3.9 4.25z"></path>
            </svg>
            Continue with Apple
          </button>

          <div className="mt-auto text-center pb-5 text-[14px] text-[#888888]">
            Don't have an account? <Link to="/signup" className="text-[#A855F7] font-bold">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
