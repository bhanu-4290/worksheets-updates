import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, LogIn, AlertCircle, Users, BookOpen } from "lucide-react";

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
    <div className="min-h-screen flex flex-col justify-between p-4 bg-slate-900">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md my-6">
          {/* Plain, Direct Brand & Hero Copy */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white font-extrabold text-xl mb-3">
              M
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              MATRIX SYNC SPACE Portal
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              MATRIX internal platform for daily work reporting, task assignment, and team supervision across Super Admins, Managers, Team Leads, and Executives.
            </p>
          </div>

          {/* Card */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-6 sm:p-7">
            {error && (
              <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 uppercase tracking-wider">
                  Employee ID or Email Address
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. M-000894 or gbhanu2811@gmail.com"
                  className="w-full px-3.5 py-2 rounded-md border border-slate-600 bg-slate-900 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2 rounded-md border border-slate-600 bg-slate-900 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-sm animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In to Workspace
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center pt-1">
                By signing in, you agree to our{" "}
                <Link to="/privacy-policy" className="text-blue-400 hover:underline">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link to="/terms-and-conditions" className="text-blue-400 hover:underline">
                  Terms &amp; Conditions
                </Link>
                .
              </p>
            </form>

            {/* Quick Team Personas */}
            <div className="mt-6 pt-5 border-t border-slate-700">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Quick Role Sign-In (Password: Matrix@4290)</span>
                </div>
                <Link
                  to="/how-to-use"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                >
                  <BookOpen className="w-3 h-3" /> How to Use
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("sriaditya.c@matrixst.in")}
                  className="p-2.5 rounded-md border border-yellow-500/60 bg-yellow-400/20 text-yellow-100 hover:bg-yellow-400/30 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">Sri Aditya</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400 text-slate-950 font-bold shrink-0">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-[10px] text-yellow-200/90 truncate mt-0.5">
                    M-000925 • Super Admin
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin("rahul.d@matrixst.in")}
                  className="p-2.5 rounded-md border border-orange-500/50 bg-orange-950/40 text-orange-100 hover:bg-orange-900/50 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">Rahul Kiran</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/30 text-orange-300 font-mono shrink-0">
                      MANAGER
                    </span>
                  </div>
                  <div className="text-[10px] text-orange-300/80 truncate mt-0.5">
                    M-000844 • Manager
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin("phaneeswaranadh.a@matrixst.in")}
                  className="p-2.5 rounded-md border border-orange-500/50 bg-orange-950/40 text-orange-100 hover:bg-orange-900/50 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">Phaneeshwarnadh</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/30 text-orange-300 font-mono shrink-0">
                      MANAGER
                    </span>
                  </div>
                  <div className="text-[10px] text-orange-300/80 truncate mt-0.5">
                    M-000899 • Manager
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin("akhil.b@matrixst.in")}
                  className="p-2.5 rounded-md border border-orange-500/50 bg-orange-950/40 text-orange-100 hover:bg-orange-900/50 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">Akhil Babu</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/30 text-orange-300 font-mono shrink-0">
                      MANAGER
                    </span>
                  </div>
                  <div className="text-[10px] text-orange-300/80 truncate mt-0.5">
                    M-000233 • Manager
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("gbhanu2811@gmail.com")}
                  className="p-2.5 rounded-md border border-emerald-500/40 bg-emerald-950/30 text-emerald-100 hover:bg-emerald-900/40 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">G Bhanu Kiran</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono shrink-0">
                      LEAD / DC
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 truncate mt-0.5">
                    M-000894 • DC Lead
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin("jannurajanaveen@gmail.com")}
                  className="p-2.5 rounded-md border border-emerald-500/40 bg-emerald-950/30 text-emerald-100 hover:bg-emerald-900/40 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">Jannu Raja Naveen</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono shrink-0">
                      LEAD / DC
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 truncate mt-0.5">
                    M-000764 • DC Lead
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-5 text-xs text-slate-400 flex flex-col items-center justify-center gap-1 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>MATRIX • Role-Scoped Session Authentication</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Support: gbhanu2811@gmail.com | Contact: 7337504290
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <footer className="max-w-md w-full mx-auto pt-4 pb-2 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <Link to="/how-to-use" className="hover:text-white hover:underline">
          How to Use
        </Link>
        <Link to="/privacy-policy" className="hover:text-white hover:underline">
          Privacy Policy
        </Link>
        <Link to="/terms-and-conditions" className="hover:text-white hover:underline">
          Terms &amp; Conditions
        </Link>
      </footer>
    </div>
  );
};
