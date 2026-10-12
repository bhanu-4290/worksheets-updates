import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, LogIn, AlertCircle, Sparkles } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Matrix@4290");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleDemoLogin = async (demoIdentifier: string) => {
    setEmail(demoIdentifier);
    setPassword("Matrix@4290");
    setError(null);
    setLoading(true);
    try {
      await login(demoIdentifier, "Matrix@4290");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md my-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-extrabold text-2xl shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/20 mb-3.5">
            W
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            WorkTrack Enterprise
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Daily Work Tracking & Team Performance System
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-3 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Username or Email Address
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul or rahul@worktrack.company"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/60 text-white text-xs font-medium placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/60 text-white text-xs font-medium placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to WorkTrack
                </>
              )}
            </button>
          </form>

          {/* Quick Team Personas */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>One-Click Team Login (Password: Matrix@4290)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin("rahul@worktrack.company")}
                className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/30 text-purple-200 hover:bg-purple-900/40 text-left transition-all hover-card-lift"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Rahul</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">ADMIN</span>
                </div>
                <div className="text-[10px] text-purple-400/80 truncate mt-0.5">
                  Super Admin
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("phani@worktrack.company")}
                className="p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 text-indigo-200 hover:bg-indigo-900/40 text-left transition-all hover-card-lift"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Phani</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">MANAGER</span>
                </div>
                <div className="text-[10px] text-indigo-400/80 truncate mt-0.5">
                  Department Manager
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("tharun@worktrack.company")}
                className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-900/40 text-left transition-all hover-card-lift"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Tharun</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">LEAD</span>
                </div>
                <div className="text-[10px] text-emerald-400/80 truncate mt-0.5">
                  Team Leader
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("bhanu@worktrack.company")}
                className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/30 text-blue-200 hover:bg-blue-900/40 text-left transition-all hover-card-lift"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Bhanu</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">EXEC</span>
                </div>
                <div className="text-[10px] text-blue-400/80 truncate mt-0.5">
                  Executive
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleDemoLogin("naveen@worktrack.company")}
              className="mt-2 w-full p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/30 text-blue-200 hover:bg-blue-900/40 text-left transition-all hover-card-lift flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-xs">Naveen</span>
                <span className="text-[10px] text-blue-300/80 ml-2">Executive</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">EXEC</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Internal Corporate System • Encrypted Session Token</span>
        </div>
      </div>
    </div>
  );
};
