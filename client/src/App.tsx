import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DailyReportPage } from "./pages/DailyReportPage";
import { DailyReportDetailPage } from "./pages/DailyReportDetailPage";
import { ReviewQueuePage } from "./pages/ReviewQueuePage";
import { TasksPage } from "./pages/TasksPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { EscalationsPage } from "./pages/EscalationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { TeamOverviewPage } from "./pages/TeamOverviewPage";
import { DirectoryPage } from "./pages/DirectoryPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminDepartmentsPage } from "./pages/AdminDepartmentsPage";
import { AdminTeamsPage } from "./pages/AdminTeamsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ChatPage } from "./pages/ChatPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { HowToUsePage } from "./pages/HowToUsePage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsAndConditionsPage } from "./pages/TermsAndConditionsPage";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { Role } from "./types";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

const OptionalAuthRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-md animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Layout>{children}</Layout>;
  }

  return children;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth & Informational Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/how-to-use"
              element={
                <OptionalAuthRoute>
                  <HowToUsePage />
                </OptionalAuthRoute>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <OptionalAuthRoute>
                  <PrivacyPolicyPage />
                </OptionalAuthRoute>
              }
            />
            <Route
              path="/terms-and-conditions"
              element={
                <OptionalAuthRoute>
                  <TermsAndConditionsPage />
                </OptionalAuthRoute>
              }
            />

            {/* Protected Workspace Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<DailyReportPage />} />
              <Route path="reports/new" element={<DailyReportPage />} />
              <Route path="reports/:id" element={<DailyReportDetailPage />} />
              <Route path="tasks" element={<Navigate to="/dashboard" replace />} />
              <Route path="tasks/:id" element={<Navigate to="/dashboard" replace />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="directory" element={<DirectoryPage />} />
              <Route path="projects" element={<Navigate to="/dashboard" replace />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Review Queue (Lead, Manager, Super Admin) */}
              <Route
                path="reviews"
                element={
                  <ProtectedRoute allowedRoles={["TEAM_LEAD", "MANAGER", "SUPER_ADMIN"]}>
                    <ReviewQueuePage />
                  </ProtectedRoute>
                }
              />

              {/* Blocker Escalations (Lead, Manager, Super Admin) */}
              <Route
                path="escalations"
                element={
                  <ProtectedRoute allowedRoles={["TEAM_LEAD", "MANAGER", "SUPER_ADMIN"]}>
                    <EscalationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Team Overview */}
              <Route
                path="team"
                element={
                  <ProtectedRoute allowedRoles={["TEAM_LEAD", "MANAGER", "SUPER_ADMIN"]}>
                    <TeamOverviewPage />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Console */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/departments"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <AdminDepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/teams"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <AdminTeamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="403" element={<AccessDeniedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
