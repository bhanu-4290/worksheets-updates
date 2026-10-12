import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Badge } from "../components/Badge";
import { User, Shield, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setStatus({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setStatus({ type: "error", text: err.message || "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Account & Security
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review your employee credentials, department assignment, and update password.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {user.fullName}
              </h2>
              <Badge variant={user.role} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.jobTitle}</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
              {user.department?.name || "Corporate"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Employee ID</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user.employeeId}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Official Email</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user.email}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Assigned Team Lead</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user.teamLead?.fullName || "None (Direct Reporting)"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Assigned Department Manager</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user.manager?.fullName || "None"}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
          <KeyRound className="w-4 h-4 text-indigo-500" />
          <span>Change Password</span>
        </div>

        {status && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              status.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
