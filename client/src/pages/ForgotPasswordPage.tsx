import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Password state
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await api.post("/auth/forgot-password", { email });
      setMessage(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate reset request");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await api.post("/auth/reset-password", {
        token: resetToken,
        newPassword,
      });
      setMessage(res.message);
      setResetDone(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 bg-slate-100 dark:bg-slate-950">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md my-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Account Recovery
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Reset your WorkTrack employee account password
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resetDone ? (
              <div className="text-center py-4 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Password Reset Complete
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You can now sign in with your new password.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : resetToken ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-xs text-amber-800 dark:text-amber-300">
                  Reset token verified. Enter your new password below.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                >
                  {loading ? "Resetting..." : "Save New Password"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRequestToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@worktrack.company"
                    className="w-full px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                >
                  {loading ? "Requesting..." : "Send Reset Instructions"}
                </button>
                {message && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-md text-xs text-blue-700 dark:text-blue-300">
                    {message}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 text-center">
                  Protected under our{" "}
                  <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/terms-and-conditions" className="text-blue-600 hover:underline">
                    Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="max-w-md w-full mx-auto pt-4 pb-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        <Link to="/how-to-use" className="hover:text-blue-600 hover:underline">
          How to Use
        </Link>
        <Link to="/privacy-policy" className="hover:text-blue-600 hover:underline">
          Privacy Policy
        </Link>
        <Link to="/terms-and-conditions" className="hover:text-blue-600 hover:underline">
          Terms &amp; Conditions
        </Link>
      </footer>
    </div>
  );
};
