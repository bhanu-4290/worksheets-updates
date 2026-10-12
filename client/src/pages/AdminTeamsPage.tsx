import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Team, Department, User } from "../types";
import { Modal } from "../components/Modal";
import { Network, Plus, Users, UserPlus, Trash2 } from "lucide-react";

export const AdminTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leads, setLeads] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Team Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    code: "",
    departmentId: "",
    teamLeadId: "",
  });

  // Manage Members Modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedAddUserId, setSelectedAddUserId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, dRes, uRes]: any = await Promise.all([
        api.get("/teams"),
        api.get("/departments"),
        api.get("/users"),
      ]);
      if (tRes.success) setTeams(tRes.data || []);
      if (dRes.success) setDepartments(dRes.data || []);
      if (uRes.success) {
        setAllUsers(uRes.data || []);
        setLeads((uRes.data || []).filter((u: User) => u.role === "TEAM_LEAD"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/teams", {
        ...teamForm,
        teamLeadId: teamForm.teamLeadId || null,
      });
      setShowCreateModal(false);
      setTeamForm({ name: "", code: "", departmentId: "", teamLeadId: "" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create team");
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedAddUserId) return;
    try {
      await api.post(`/teams/${selectedTeam.id}/members`, { userId: selectedAddUserId });
      setSelectedAddUserId("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    try {
      await api.delete(`/teams/${selectedTeam.id}/members/${userId}`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team Management & Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize teams under departments, assign Team Leads, and manage team memberships.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                  {t.code}
                </span>
                <span className="text-xs text-slate-400">
                  Dept: {t.department?.name}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lead: <strong className="text-indigo-600 dark:text-indigo-400">{t.teamLead?.fullName || "Unassigned"}</strong>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">{t.members?.length || 0} Members</span>
                <button
                  onClick={() => {
                    setSelectedTeam(t);
                    setShowMembersModal(true);
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100"
                >
                  Manage Roster
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Team"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Team Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Apps Core"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. ENG-MOB"
              value={teamForm.code}
              onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Department *</label>
            <select
              required
              value={teamForm.departmentId}
              onChange={(e) => setTeamForm({ ...teamForm, departmentId: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Assigned Team Lead</label>
            <select
              value={teamForm.teamLeadId}
              onChange={(e) => setTeamForm({ ...teamForm, teamLeadId: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="">-- Select Team Lead --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName} ({l.jobTitle})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl border text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
            >
              Create Team
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Members Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`Roster: ${selectedTeam?.name}`}
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedAddUserId}
              onChange={(e) => setSelectedAddUserId(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="">-- Add Employee to Team --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.jobTitle})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              Add
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
            {selectedTeam?.members?.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {m.fullName}
                  </span>
                  <div className="text-[10px] text-slate-400">{m.jobTitle}</div>
                </div>
                <button
                  onClick={() => handleRemoveMember(m.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded"
                  title="Remove from team"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
