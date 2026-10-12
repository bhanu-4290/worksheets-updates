export type Role = "SUPER_ADMIN" | "MANAGER" | "TEAM_LEAD" | "EXECUTIVE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskStatus =
  | "TO_DO"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "IN_REVIEW"
  | "COMPLETED"
  | "CANCELLED";

export type ReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REVISION_REQUESTED";

export type EscalationStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "ESCALATED_TO_ADMIN";

export type EscalationUrgency = "NORMAL" | "HIGH" | "CRITICAL";

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  managerId?: string | null;
  isActive: boolean;
  manager?: { id: string; fullName: string; email: string; employeeId: string } | null;
  teams?: Team[];
  _count?: { users: number; teams: number; projects: number };
}

export interface Team {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  teamLeadId?: string | null;
  isActive: boolean;
  department?: Department;
  teamLead?: { id: string; fullName: string; email: string; employeeId: string } | null;
  members?: User[];
}

export interface User {
  id: string;
  employeeId: string;
  email: string;
  fullName: string;
  jobTitle: string;
  role: Role;
  departmentId?: string | null;
  managerId?: string | null;
  teamLeadId?: string | null;
  joiningDate: string;
  isActive: boolean;
  department?: Department | null;
  manager?: { id: string; fullName: string; email: string; jobTitle?: string } | null;
  teamLead?: { id: string; fullName: string; email: string; jobTitle?: string } | null;
  teams?: Team[];
  managedDepartments?: Department[];
  ledTeams?: Team[];
  unreadNotificationsCount?: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  departmentId: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  department?: Department;
  _count?: { tasks: number };
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  user: { id: string; fullName: string; email: string; employeeId: string; jobTitle?: string };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  previousValue?: string | null;
  newValue?: string | null;
  details?: string | null;
  createdAt: string;
  user: { id: string; fullName: string };
}

export interface Task {
  id: string;
  taskCode: string;
  title: string;
  description: string;
  projectId: string;
  departmentId: string;
  assignedTeamLeadId?: string | null;
  createdById: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null; // derived only from recorded work logs!
  progressPercentage: number;
  isOverdue?: boolean;
  project?: Project;
  department?: Department;
  teamLead?: { id: string; fullName: string; email: string } | null;
  createdBy?: { id: string; fullName: string; email: string } | null;
  assignees?: User[];
  comments?: TaskComment[];
  commentsCount?: number;
  histories?: TaskHistory[];
  createdAt: string;
}

export interface DailyWorkEntry {
  id?: string;
  dailyReportId?: string;
  taskId?: string | null;
  activityTitle: string;
  description: string;
  startTime?: string | null;
  endTime?: string | null;
  hoursSpent?: number | null; // Optional!
  progressPercentage: number;
  status: string;
  deliverables?: string | null;
  blockers?: string | null;
  supportRequired?: string | null;
  nextDayPlan?: string | null;
  task?: { id: string; taskCode: string; title: string; status?: string } | null;
}

export interface ReportReview {
  id: string;
  dailyReportId: string;
  reviewerId: string;
  reviewStatus: "APPROVED" | "REVISION_REQUESTED";
  comments: string;
  createdAt: string;
  reviewer: { id: string; fullName: string; email: string; jobTitle?: string };
}

export interface ReportRevisionHistory {
  id: string;
  dailyReportId: string;
  revisionNumber: number;
  snapshotJson: string;
  reason?: string | null;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  reportingDate: string; // YYYY-MM-DD
  status: ReportStatus;
  submittedAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    employeeId: string;
    jobTitle: string;
    department?: Department | null;
    manager?: { id: string; fullName: string; email: string } | null;
    teamLead?: { id: string; fullName: string; email: string } | null;
  };
  entriesCount?: number;
  totalHoursRecorded?: number | null;
  hasUnreportedHours?: boolean;
  blockerCount?: number;
  latestReview?: ReportReview | null;
  entries: DailyWorkEntry[];
  reviews?: ReportReview[];
  revisionHistory?: ReportRevisionHistory[];
}

export interface BlockerEscalation {
  id: string;
  workEntryId?: string | null;
  dailyReportId?: string | null;
  departmentId: string;
  escalatedById: string;
  assignedOwnerId?: string | null;
  status: EscalationStatus;
  urgency: EscalationUrgency;
  title: string;
  description: string;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  department: Department;
  escalatedBy: { id: string; fullName: string; email: string; jobTitle?: string };
  assignedOwner?: { id: string; fullName: string; email: string; jobTitle?: string } | null;
  dailyReport?: {
    id: string;
    reportingDate: string;
    user: { id: string; fullName: string; employeeId: string };
  } | null;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  senderId?: string | null;
  eventType: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; fullName: string; email: string } | null;
}

export interface CompanySetting {
  id: string;
  companyName: string;
  timezone: string;
  workDays: string;
  submissionDeadlineTime: string;
  gracePeriodHours: number;
  allowMidnightEntries: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  detailsJson?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    employeeId: string;
    role: Role;
  } | null;
}
