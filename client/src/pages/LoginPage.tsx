import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ShieldCheck, AlertCircle, ChevronLeft, Eye, EyeOff, Sparkles } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError("Please agree to the platform security & data terms to proceed.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#06121f] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-sky-500 selection:text-slate-950 font-sans">
      {/* Background radial ambient lights */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-sky-500/30">
            S
          </div>
          <span className="font-extrabold tracking-wider text-sm text-white">
            SYNC SPACE
          </span>
        </div>

        <Link
          to="/how-to-use"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-all backdrop-blur-md shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to home</span>
        </Link>
      </header>

      {/* Main Hero Split Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 py-6">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Glassmorphism Login Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-start">
            <div className="w-full max-w-md bg-[#0d2138]/85 border border-[#1b3e68]/70 backdrop-blur-xl rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-950/60 relative">
              
              {/* Subtle Tag Line */}
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-sky-400">
                <span>Visual Space</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">MATRIX ENTERPRISE</span>
              </div>

              {/* Headline */}
              <div className="mt-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  Over 28 personnel <br />
                  <span className="text-slate-100">Shaping the perfect space</span>
                </h1>
                <p className="text-xs text-sky-200/70 mt-1.5 font-medium">
                  Currently only supports MATRIX verified personnel &amp; teams
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
                {/* Input 1: Work Email or Employee ID */}
                <div className="relative flex items-center rounded-xl border border-[#1e416a] bg-[#08182b]/70 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20 transition-all">
                  <div className="pl-3.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yatingzang0215@gmail.com or M-000925"
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none"
                  />
                </div>

                {/* Input 2: Password */}
                <div className="relative flex items-center rounded-xl border border-[#1e416a] bg-[#08182b]/70 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20 transition-all">
                  <div className="pl-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-3.5 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Checkbox agreement */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-[#1e416a] bg-[#08182b] text-sky-500 focus:ring-sky-400 w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                    <span className="leading-snug">
                      I agree to the platform accessing my{" "}
                      <Link to="/privacy-policy" className="text-sky-400 hover:underline">
                        information
                      </Link>{" "}
                      and security terms
                    </span>
                  </label>
                </div>

                {/* CTA Button: Start now */}
                <button
                  type="submit"
                  disabled={loading || !agreeTerms}
                  className="w-full mt-2 py-3.5 px-6 rounded-xl bg-sky-400 hover:bg-sky-300 active:bg-sky-500 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Start now</span>
                  )}
                </button>

                {/* Bottom Footer Row */}
                <div className="pt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    No Account Yet ?{" "}
                    <Link to="/forgot-password" className="text-sky-400 hover:underline font-semibold">
                      Registered
                    </Link>
                  </span>

                  <Link to="/forgot-password" className="text-slate-400 hover:text-sky-300 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {/* Quick Hint for Enterprise Credentials */}
                <div className="mt-4 pt-3.5 border-t border-[#1b3e68]/50 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Default Password: <code className="text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">Matrix@123</code></span>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: 3D Isometric Modern Workspace Room */}
          <div className="lg:col-span-7 hidden lg:flex items-center justify-center relative">
            <div className="relative w-full max-w-2xl flex items-center justify-center">
              {/* Radial blue glow behind the 3D room */}
              <div className="absolute inset-0 bg-sky-500/15 rounded-full blur-3xl pointer-events-none scale-90" />
              
              {/* 3D Isometric Room Render */}
              <img
                src="/login-3d-room.png"
                alt="SYNC SPACE Modern 3D Tech Workspace"
                className="relative z-10 w-full max-h-[700px] object-contain drop-shadow-[0_20px_60px_rgba(14,165,233,0.18)] select-none pointer-events-none"
              />

              {/* Floating ambient badge 1 */}
              <div className="absolute top-8 left-8 z-20 px-3 py-1.5 rounded-full bg-[#0c1f36]/80 border border-sky-500/30 backdrop-blur-md text-[11px] font-semibold text-sky-200 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Workspace • 28 Active Staff</span>
              </div>

              {/* Floating ambient badge 2 */}
              <div className="absolute bottom-6 right-6 z-20 px-3.5 py-1.5 rounded-full bg-[#0c1f36]/80 border border-sky-500/30 backdrop-blur-md text-[11px] font-semibold text-slate-300 flex items-center gap-2 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>SYNC SPACE • MATRIX Operations</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Navigation Bar */}
      <footer className="relative z-20 py-4 px-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-5 border-t border-slate-800/60">
        <span>© 2026 MATRIX Operations Portal</span>
        <span className="text-slate-700">•</span>
        <Link to="/how-to-use" className="hover:text-slate-300 hover:underline">
          How to Use
        </Link>
        <span className="text-slate-700">•</span>
        <Link to="/privacy-policy" className="hover:text-slate-300 hover:underline">
          Privacy Policy
        </Link>
        <span className="text-slate-700">•</span>
        <Link to="/terms-and-conditions" className="hover:text-slate-300 hover:underline">
          Terms &amp; Conditions
        </Link>
        <span className="text-slate-700">•</span>
        <span>Support: <a href="mailto:gbhanu2811@gmail.com" className="text-slate-400 hover:underline">gbhanu2811@gmail.com</a> | 7337504290</span>
      </footer>
    </div>
  );
};
