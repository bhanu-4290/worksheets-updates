import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { User } from "../types";
import { useNavigate } from "react-router-dom";
import {
  X,
  Search,
  MessageSquare,
  UserPlus,
  GitBranch,
  ArrowDown,
  RefreshCw,
} from "lucide-react";

interface EmployeeFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeFlowModal: React.FC<EmployeeFlowModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/users?status=active&flow=true");
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load employee flow:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeUsers = users.filter((u) => u.isActive !== false);

  // Helper to find user by loose name matching or email prefix
  const findUser = (searchTokens: string[]): User | undefined => {
    return activeUsers.find((u) => {
      const fn = u.fullName.toLowerCase();
      const em = u.email.toLowerCase();
      return searchTokens.some(
        (t) => fn.includes(t.toLowerCase()) || em.includes(t.toLowerCase())
      );
    });
  };

  // Check search query against user or label
  const matches = (label: string, userObj?: User) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (label.toLowerCase().includes(q)) return true;
    if (userObj) {
      if (userObj.fullName.toLowerCase().includes(q)) return true;
      if (userObj.email.toLowerCase().includes(q)) return true;
      if (userObj.employeeId?.toLowerCase().includes(q)) return true;
      if (userObj.jobTitle?.toLowerCase().includes(q)) return true;
    }
    return false;
  };

  // Find Sri Aditya (Super Admin - Yellow)
  const sriAditya =
    activeUsers.find((u) => u.role === "SUPER_ADMIN") ||
    findUser(["Aditya", "sriaditya"]) || {
      id: "sri-aditya",
      fullName: "Sri Aditya Canuparthi",
      jobTitle: "Super Administrator & Managing Director",
      role: "SUPER_ADMIN",
      email: "sriaditya.c@matrixst.in",
      employeeId: "M-000925",
    } as User;

  // The 6 Operational Branches (No L1 data)
  const branches = [
    // Branch 1: Rahul (DC infra / EMS / MIT / DC krishna)
    {
      id: "b-rahul",
      managerName: "Rahul",
      domain: "DC infra / EMS / MIT / DC krishna",
      user: findUser(["Rahul", "Darnasi"]),
      sections: [
        {
          type: "green",
          title: "Surya (EMS Lead)",
          members: [
            { name: "Surya (EMS)", user: findUser(["Surya", "Appalasuryanarayana"]) },
          ],
        },
        {
          type: "sub-manager",
          managerName: "Rajesh",
          subCount: 2,
          domain: "servers / Storage",
          user: findUser(["Rajesh", "Mattaparthi"]),
          subMembers: [
            {
              type: "green",
              title: "DC Storage & Servers",
              members: [
                { name: "Gopi", user: findUser(["Gopi", "Gopinath"]) },
                { name: "Manoj", user: findUser(["Manoj", "Naga Manoj"]) },
              ],
            },
          ],
        },
        {
          type: "sub-manager",
          managerName: "Venkateshwarlu",
          subCount: 3,
          domain: "Network",
          user: findUser(["Venkateshwarlu", "Venkateswarlu"]),
          subMembers: [
            {
              type: "green",
              title: "DC Network Leads",
              members: [
                { name: "Surrendra", user: findUser(["Surendra", "Surrendra"]) },
                { name: "Prasanna", user: findUser(["Prasanna Kumar", "tanneeru"]) },
                { name: "Rasi", user: findUser(["Rasi", "Gangula"]) },
              ],
            },
          ],
        },
      ],
    },

    // Branch 2: Madhu Bhushan (Analytics / VMS & CCTV 360 co-ordination)
    {
      id: "b-madhu-bhushan",
      managerName: "Madhu Bhushan",
      domain: "Analytics / VMS & CCTV 360 co-ordination",
      user: findUser(["Madhu Bhushan", "Bhushana"]),
      sections: [],
    },

    // Branch 3: Akhil (DC manager -3 & CCTV 360 Tech related)
    {
      id: "b-akhil",
      managerName: "Akhil",
      domain: "DC manager -3 & CCTV 360 Tech related",
      user: findUser(["Akhil", "Uppada"]),
      sections: [
        {
          type: "green",
          title: "DC Tech Support Leads",
          members: [
            { name: "Kavya", user: findUser(["Kavya", "Asha Swaroopa"]) },
            { name: "Dharanidhar", user: findUser(["Dharanidhar", "Pendyala"]) },
          ],
        },
      ],
    },

    // Branch 4: Madhu sudhan (DC manager -3 & VMS)
    {
      id: "b-madhu-sudhan",
      managerName: "Madhu sudhan",
      domain: "DC manager -3 & VMS",
      user: findUser(["Madhusudhan", "Madhusudhanarao"]),
      sections: [
        {
          type: "green",
          title: "DC VMS Operations",
          members: [
            { name: "Sangeetha", user: findUser(["Sangeetha", "Soma"]) },
            { name: "Bhavya", user: findUser(["Bhavya", "Mamidala"]) },
            { name: "Veeranjaneyulu", user: findUser(["Veeranjaneyulu", "Jetti"]) },
            { name: "Mohan", user: findUser(["Mohankrishna", "Danaboina"]) },
            { name: "DRK Raju", user: findUser(["drkraju", "Ramakrishnam"]) },
          ],
        },
      ],
    },

    // Branch 5: Phaneeshwarnadh (DC manager -3 & EMS)
    {
      id: "b-phani",
      managerName: "Phaneeshwarnadh",
      domain: "DC manager -3 & EMS",
      user: findUser(["Phaneeswaranadh", "Phani"]),
      sections: [
        {
          type: "green",
          title: "DC EMS Operations",
          members: [
            { name: "Naveen", user: findUser(["Raja Naveen", "Jannu"]) },
            { name: "Tharun", user: findUser(["Thanru", "Tharun"]) },
            { name: "Bhanu", user: findUser(["Bhanu", "gbhanu2811"]) },
          ],
        },
      ],
    },

    // Branch 6: Jagan (DC manager -3 & Network)
    {
      id: "b-jagan",
      managerName: "Jagan",
      domain: "DC manager -3 & Network",
      user: findUser(["Jagan", "Dk Jagan"]),
      sections: [
        {
          type: "green",
          title: "DC Network Operations",
          members: [
            { name: "Lokesh", user: findUser(["Lokesh", "Baji"]) },
            { name: "Bhagawan", user: findUser(["Bhagavan", "Kruttiventi"]) },
            { name: "Pawan", user: findUser(["Pavan", "Sai Pavan"]) },
          ],
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-[96vw] max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  MATRIX Official Team Flow Chart
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-yellow-400/20 border border-yellow-400/40 text-yellow-200">
                  Sri Aditya (Super Admin)
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-200">
                  28 Verified Employees
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Yellow: Super Admin • Orange: Managers • Green: DC Specialists & Team Leads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadEmployees}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
              title="Refresh Flow Chart"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                navigate("/admin/users");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" /> Manage Users
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/80 text-slate-200 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend & Filter Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">
              Role Legend:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-300 text-slate-950 font-bold border border-yellow-500 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-900" />
              Yellow: Super Admin (Sri Aditya)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-200 dark:bg-orange-950/80 text-orange-950 dark:text-orange-100 font-bold border border-orange-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-600" />
              Orange: Department & Sub-Managers
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-bold border border-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
              Green: DC Specialists & Team Leads
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee in flow..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Main Flowchart Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100/70 dark:bg-slate-950/70">
          <div className="min-w-[1100px] flex flex-col items-center mx-auto pb-8">
            {/* =========================================================
                TIER 1: SUPER ADMIN (YELLOW BOX)
               ========================================================= */}
            <div
              className={`relative px-8 py-3.5 rounded-lg bg-yellow-300 dark:bg-yellow-400 text-slate-950 border-2 border-slate-900 shadow-md text-center transition-all ${
                !matches("Sri Aditya", sriAditya) ? "opacity-35" : ""
              }`}
            >
              <div className="text-base font-extrabold tracking-tight">
                Sri Aditya Canuparthi (6)
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-0.5">
                Super Administrator & Managing Director
              </div>
              <div className="text-[10px] text-slate-700 font-mono mt-0.5">
                M-000925 • sriaditya.c@matrixst.in
              </div>
              {sriAditya?.id && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/chat?user=${sriAditya.id}`);
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-2.5 h-2.5" /> Message
                </button>
              )}
            </div>

            {/* Tree Branch Connectors */}
            <div className="w-0.5 h-6 bg-slate-800 dark:bg-slate-300" />
            <div className="w-[90%] h-0.5 bg-slate-800 dark:bg-slate-300" />

            {/* 6 Department Columns */}
            <div className="grid grid-cols-6 gap-3.5 w-full pt-0 items-start">
              {branches.map((b) => {
                const isBranchActive =
                  matches(b.managerName, b.user) || matches(b.domain);

                return (
                  <div key={b.id} className="flex flex-col items-center">
                    {/* Stem down from horizontal distributor */}
                    <div className="w-0.5 h-4 bg-slate-800 dark:bg-slate-300" />
                    <ArrowDown className="w-3.5 h-3.5 -mt-1 text-slate-800 dark:text-slate-300" />

                    {/* =====================================================
                        TIER 2: ORANGE MANAGER BOX
                       ===================================================== */}
                    <div
                      className={`w-full p-3 rounded-lg bg-orange-200 dark:bg-orange-950/90 border-2 border-orange-500 text-slate-900 dark:text-orange-100 shadow-sm text-center transition-all ${
                        !isBranchActive ? "opacity-35" : ""
                      }`}
                    >
                      <div className="font-extrabold text-xs">
                        {b.managerName}
                      </div>
                      <div className="text-[10px] font-medium text-slate-700 dark:text-orange-200/90 mt-0.5 leading-snug">
                        ({b.domain})
                      </div>
                      {b.user && (
                        <div className="text-[9px] text-slate-500 dark:text-orange-300/70 mt-1 font-mono truncate">
                          {b.user.employeeId}
                        </div>
                      )}
                      {b.user?.id && (
                        <button
                          onClick={() => {
                            onClose();
                            navigate(`/chat?user=${b.user!.id}`);
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-bold transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-2.5 h-2.5" /> Chat
                        </button>
                      )}
                    </div>

                    {/* Subordinate Sections (Green DC only, no L1) */}
                    <div className="w-full space-y-2 mt-2">
                      {b.sections.map((sec: any, sIdx: number) => {
                        if (sec.type === "sub-manager") {
                          const subMgrMatches =
                            matches(sec.managerName || "", sec.user) ||
                            matches(sec.domain || "");

                          return (
                            <div key={`sub-${sIdx}`} className="space-y-1.5 pt-1">
                              <div className="w-0.5 h-2 bg-slate-400 mx-auto" />
                              <div
                                className={`w-full p-2 rounded-lg bg-orange-200/90 dark:bg-orange-950/80 border-2 border-orange-500 text-slate-900 dark:text-orange-100 shadow-2xs text-center ${
                                  !subMgrMatches ? "opacity-35" : ""
                                }`}
                              >
                                <div className="font-extrabold text-[11px]">
                                  {sec.managerName}
                                </div>
                                <div className="text-[9px] text-slate-700 dark:text-orange-200/80">
                                  ({sec.domain})
                                </div>
                                {sec.user?.id && (
                                  <button
                                    onClick={() => {
                                      onClose();
                                      navigate(`/chat?user=${sec.user!.id}`);
                                    }}
                                    className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-600 text-white text-[8px] font-bold cursor-pointer"
                                  >
                                    <MessageSquare className="w-2 h-2" /> Chat
                                  </button>
                                )}
                              </div>

                              {sec.subMembers?.map((subSec: any, smIdx: number) => (
                                <div
                                  key={`sub-mem-${smIdx}`}
                                  className="w-full p-2 rounded-lg text-center border-2 shadow-2xs bg-emerald-100/95 dark:bg-emerald-950/70 border-emerald-400 text-emerald-950 dark:text-emerald-100"
                                >
                                  <div className="text-[10px] font-extrabold uppercase tracking-tight mb-1 text-emerald-800 dark:text-emerald-300">
                                    {subSec.title}
                                  </div>
                                  <div className="space-y-1">
                                    {subSec.members?.map((m: any, mIdx: number) => (
                                      <div
                                        key={`m-${mIdx}`}
                                        className={`p-1 rounded bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 text-left ${
                                          !matches(m.name, m.user)
                                            ? "opacity-35"
                                            : ""
                                        }`}
                                      >
                                        <div className="min-w-0">
                                          <div className="text-[10px] font-bold text-slate-900 dark:text-white truncate">
                                            {m.name}
                                          </div>
                                          {m.user?.employeeId && (
                                            <div className="text-[8px] text-slate-500 font-mono truncate">
                                              {m.user.employeeId}
                                            </div>
                                          )}
                                        </div>
                                        {m.user?.id && (
                                          <button
                                            onClick={() => {
                                              onClose();
                                              navigate(`/chat?user=${m.user!.id}`);
                                            }}
                                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
                                            title={`Chat with ${m.name}`}
                                          >
                                            <MessageSquare className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        // GREEN DC SECTION
                        return (
                          <div
                            key={`sec-${sIdx}`}
                            className="w-full p-2.5 rounded-lg text-center border-2 shadow-2xs bg-emerald-100/95 dark:bg-emerald-950/70 border-emerald-400 text-emerald-950 dark:text-emerald-100"
                          >
                            <div className="text-[10px] font-extrabold uppercase tracking-tight mb-1.5 text-emerald-800 dark:text-emerald-300">
                              {sec.title}
                            </div>
                            <div className="space-y-1">
                              {sec.members?.map((m: any, mIdx: number) => (
                                <div
                                  key={`mem-${mIdx}`}
                                  className={`p-1.5 rounded-md bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 text-left ${
                                    !matches(m.name, m.user)
                                      ? "opacity-35"
                                      : ""
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-slate-900 dark:text-white truncate">
                                      {m.name}
                                    </div>
                                    {m.user?.employeeId && (
                                      <div className="text-[8px] text-slate-500 font-mono truncate">
                                        {m.user.employeeId}
                                      </div>
                                    )}
                                  </div>
                                  {m.user?.id && (
                                    <button
                                      onClick={() => {
                                        onClose();
                                        navigate(`/chat?user=${m.user!.id}`);
                                      }}
                                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
                                      title={`Chat with ${m.name}`}
                                    >
                                      <MessageSquare className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
