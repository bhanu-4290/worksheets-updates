import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Department, User } from "../types";
import { Modal } from "../components/Modal";
import { Building2, Plus, Edit, Users, FolderKanban } from "lucide-react";

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, uRes]: any = await Promise.all([
        api.get("/departments"),
        api.get("/users?role=MANAGER"),
      ]);
      if (dRes.success) setDepartments(dRes.data || []);
      if (uRes.success) setManagers(uRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/departments", {
        ...formData,
        managerId: formData.managerId || null,
      });
      setShowModal(false);
      setFormData({ name: "", code: "", description: "", managerId: "" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create department");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Department Administration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure organizational divisions, department codes, and assigned Department Managers.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Department
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                  {dept.code}
                </span>
                <span className="text-xs text-slate-400">
                  {dept.isActive ? "Active" : "Archived"}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{dept.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {dept.description || "No description provided."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Department Manager:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {dept.manager?.fullName || "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Teams: {dept._count?.teams || 0}</span>
                  <span>Employees: {dept._count?.users || 0}</span>
                  <span>Projects: {dept._count?.projects || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Department"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Quality Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. QE"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Scope and purpose..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Assigned Department Manager</label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="">-- Select Manager --</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl border text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
