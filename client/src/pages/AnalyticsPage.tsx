import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [complianceData, setComplianceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadCompliance();
  }, [startDate, endDate]);

  const loadCompliance = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(
        `/analytics/compliance?startDate=${startDate}&endDate=${endDate}`
      );
      if (res.success) setComplianceData(res.data);
    } catch (err) {
      console.error("Failed to load compliance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const token = localStorage.getItem("worktrack_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `/api/v1/analytics/export?startDate=${startDate}&endDate=${endDate}`,
        {
          headers,
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worktrack_report_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Failed to download CSV export");
    }
  };

  // Chart datasets
  const chartData =
    complianceData?.results?.map((r: any) => ({
      name: r.fullName,
      Actual: r.actualSubmissions,
      Expected: r.expectedSubmissions,
      Rate: r.complianceRate,
    })) || [];

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reporting & Compliance Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Expected submissions are calculated strictly from configured company working days, excluding weekends and official holidays.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export Scoped CSV
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {complianceData && (
          <div className="flex items-center gap-3 text-slate-500">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold">
              {complianceData.workingDays} Active Working Days
            </span>
            <span className="text-slate-400">(Weekends & Holidays Excluded)</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
        </div>
      ) : (
        <>
          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart: Expected vs Actual */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Submissions Comparison (Actual vs Expected Days)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="Actual" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expected" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Compliance Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Compliance Summary
                </h3>
                <p className="text-xs text-slate-400">
                  Overall department reporting adherence rate across active working days.
                </p>
              </div>

              <div className="py-6 text-center">
                {(() => {
                  const avg =
                    chartData.length > 0
                      ? Math.round(
                          chartData.reduce((acc: number, c: any) => acc + c.Rate, 0) /
                            chartData.length
                        )
                      : 100;
                  return (
                    <div>
                      <span className="text-5xl font-black text-blue-600 dark:text-blue-400">
                        {avg}%
                      </span>
                      <p className="text-xs font-semibold text-slate-500 mt-2">
                        Average Reporting Compliance
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                Axiom: Missing submissions are accounted strictly against configured work schedules and are not interpreted as zero productivity.
              </div>
            </div>
          </div>

          {/* Detailed Compliance Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Detailed Employee Compliance Audit
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Employee ID</th>
                    <th className="px-6 py-3.5 font-bold">Full Name</th>
                    <th className="px-6 py-3.5 font-bold">Department</th>
                    <th className="px-6 py-3.5 font-bold">Working Days</th>
                    <th className="px-6 py-3.5 font-bold">Expected Submissions</th>
                    <th className="px-6 py-3.5 font-bold">Actual Submissions</th>
                    <th className="px-6 py-3.5 font-bold">Missing</th>
                    <th className="px-6 py-3.5 font-bold text-right">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {complianceData?.results?.map((emp: any) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {emp.employeeId}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {emp.fullName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {emp.department}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {emp.workingDays} days
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {emp.expectedSubmissions}
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                        {emp.actualSubmissions}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {emp.missingSubmissions}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            emp.complianceRate >= 80
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {emp.complianceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
