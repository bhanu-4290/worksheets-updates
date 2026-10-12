import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CompanySetting, Holiday } from "../types";
import { Modal } from "../components/Modal";
import { Settings, Calendar, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySetting | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  // New Holiday Modal
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: "",
    isRecurring: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/settings");
      if (res.success && res.data) {
        setSettings(res.data.settings);
        setHolidays(res.data.holidays || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.put("/settings", settings);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update settings");
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/settings/holidays", holidayForm);
      setShowHolidayModal(false);
      setHolidayForm({ name: "", date: "", isRecurring: false });
      loadSettings();
    } catch (err: any) {
      alert(err.message || "Failed to add holiday");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!window.confirm("Remove this holiday?")) return;
    try {
      await api.delete(`/settings/holidays/${id}`);
      loadSettings();
    } catch (err: any) {
      alert(err.message || "Failed to delete holiday");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Company Settings & Holiday Schedules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure working day policies, reporting deadlines, grace periods, and calendar holidays.
        </p>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Company settings updated successfully!</span>
        </div>
      )}

      {loading || !settings ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Policy Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-500" />
              Reporting Deadlines & Working Days
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Active Working Days (Comma Separated)
                </label>
                <input
                  type="text"
                  required
                  value={settings.workDays}
                  onChange={(e) => setSettings({ ...settings, workDays: e.target.value })}
                  placeholder="Monday,Tuesday,Wednesday,Thursday,Friday"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Excludes weekends from expected daily report submission compliance.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Daily Deadline (24h format)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="19:00"
                    value={settings.submissionDeadlineTime}
                    onChange={(e) =>
                      setSettings({ ...settings, submissionDeadlineTime: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Grace Period (Hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    required
                    value={settings.gracePeriodHours}
                    onChange={(e) =>
                      setSettings({ ...settings, gracePeriodHours: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </form>
          </div>

          {/* Holiday Calendar Management */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Company Holidays Calendar ({holidays.length})
              </h2>

              <button
                onClick={() => setShowHolidayModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Holiday
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Days listed here are excluded from mandatory daily report submissions in compliance calculations.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto text-xs">
              {holidays.map((h) => (
                <div key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{h.name}</span>
                    <div className="text-[10px] text-slate-400">{h.date.split("T")[0]}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500"
                    title="Delete holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      <Modal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        title="Add Official Company Holiday"
      >
        <form onSubmit={handleAddHoliday} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Holiday Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Independence Day"
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Date *</label>
            <input
              type="date"
              required
              value={holidayForm.date}
              onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isRecurring"
              checked={holidayForm.isRecurring}
              onChange={(e) => setHolidayForm({ ...holidayForm, isRecurring: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <label htmlFor="isRecurring" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Recurring annually
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowHolidayModal(false)}
              className="px-4 py-2 rounded-xl border text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
            >
              Add Holiday
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
