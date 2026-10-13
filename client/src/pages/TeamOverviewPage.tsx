import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { Team, User } from "../types";
import { Users, Building2, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const TeamOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [user]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const [tRes, uRes]: any = await Promise.all([api.get("/teams"), api.get("/users")]);
      if (tRes.success) setTeams(tRes.data || []);
      if (uRes.success) setUsersList(uRes.data || []);
    } catch (err) {
      console.error("Failed to load team data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Team Overview & Workload
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scoped visibility of assigned teams, Team Leads, and subordinate members.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center text-slate-400 text-xs">
          No teams found within your authorized organizational scope.
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    {team.name}
                  </span>
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md font-semibold">
                    {team.code}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Department:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {team.department?.name}
                  </strong>{" "}
                  • Team Lead:{" "}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {team.teamLead?.fullName || "Unassigned"}
                  </strong>
                </div>
              </div>

              {/* Members table */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Assigned Members ({team.members?.length || 0})
                </h4>
                {team.members?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No members assigned to this team.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {team.members?.map((member) => (
                      <div
                        key={member.id}
                        className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {member.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {member.employeeId} • {member.jobTitle}
                          </div>
                        </div>
                        <Badge variant={member.role} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
