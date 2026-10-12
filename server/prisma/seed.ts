import bcrypt from "bcryptjs";
import { initDatabase, prisma } from "../src/config/db.js";

export async function runSeed() {
  console.log("==> Running WorkTrack Custom Team Database Seed...");
  await initDatabase();

  const passwordHash = await bcrypt.hash("Matrix@4290", 10);

  // 1. Company Settings
  await prisma.companySetting.deleteMany();
  await prisma.companySetting.create({
    data: {
      companyName: "WorkTrack Enterprise",
      timezone: "UTC",
      workDays: "Monday,Tuesday,Wednesday,Thursday,Friday",
      submissionDeadlineTime: "19:00",
      gracePeriodHours: 2,
      allowMidnightEntries: true,
    },
  });

  // 2. Holidays
  await prisma.holiday.deleteMany();
  await prisma.holiday.createMany({
    data: [
      { name: "New Year's Day", date: new Date("2026-01-01"), isRecurring: true },
      { name: "Labor Day", date: new Date("2026-05-01"), isRecurring: true },
      { name: "Independence Day", date: new Date("2026-07-04"), isRecurring: true },
      { name: "Thanksgiving Day", date: new Date("2026-11-26"), isRecurring: false },
      { name: "Christmas Day", date: new Date("2026-12-25"), isRecurring: true },
    ],
  });

  // 3. Clean all existing operational, transactional, and user data
  console.log("==> Cleaning all previous data...");
  await prisma.chatMessage.deleteMany().catch(() => {});
  await prisma.announcement.deleteMany().catch(() => {});
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.escalationHistory?.deleteMany?.().catch(() => {});
  await prisma.blockerEscalation.deleteMany().catch(() => {});
  await prisma.reportRevisionHistory.deleteMany().catch(() => {});
  await prisma.reportReview.deleteMany().catch(() => {});
  await prisma.dailyWorkEntry.deleteMany().catch(() => {});
  await prisma.dailyReport.deleteMany().catch(() => {});
  await prisma.taskHistory.deleteMany().catch(() => {});
  await prisma.taskComment.deleteMany().catch(() => {});
  await prisma.taskAssignment.deleteMany().catch(() => {});
  await prisma.task.deleteMany().catch(() => {});
  await prisma.project.deleteMany().catch(() => {});
  await prisma.teamMembership.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});
  await prisma.team.deleteMany().catch(() => {});
  await prisma.department.deleteMany().catch(() => {});

  // 4. Create Department
  console.log("==> Creating Department: Engineering & Technology...");
  const deptEng = await prisma.department.create({
    data: {
      name: "Engineering & Technology",
      code: "ENG",
      description: "Core software engineering, architecture, and technology operations",
    },
  });

  // 5. Create Team
  console.log("==> Creating Team: Core Engineering Team...");
  const teamCore = await prisma.team.create({
    data: {
      name: "Core Engineering Team",
      code: "CORE-ENG",
      departmentId: deptEng.id,
    },
  });

  // 6. Create Users
  // Admin: Rahul
  console.log("==> Creating Admin: Rahul...");
  const rahulAdmin = await prisma.user.create({
    data: {
      employeeId: "EMP001",
      email: "rahul@worktrack.company",
      passwordHash,
      fullName: "Rahul",
      jobTitle: "Super Administrator & Director",
      role: "SUPER_ADMIN",
      departmentId: deptEng.id,
      isActive: true,
      joiningDate: new Date("2024-01-01"),
    },
  });

  // Manager: Phani
  console.log("==> Creating Manager: Phani...");
  const phaniManager = await prisma.user.create({
    data: {
      employeeId: "EMP002",
      email: "phani@worktrack.company",
      passwordHash,
      fullName: "Phani",
      jobTitle: "Engineering Manager",
      role: "MANAGER",
      departmentId: deptEng.id,
      managerId: rahulAdmin.id,
      isActive: true,
      joiningDate: new Date("2024-03-15"),
    },
  });

  // Assign Phani as Manager of the Department
  await prisma.department.update({
    where: { id: deptEng.id },
    data: { managerId: phaniManager.id },
  });

  // Team Lead: Tharun
  console.log("==> Creating Team Lead: Tharun...");
  const tharunLead = await prisma.user.create({
    data: {
      employeeId: "EMP003",
      email: "tharun@worktrack.company",
      passwordHash,
      fullName: "Tharun",
      jobTitle: "Team Lead & Technical Architect",
      role: "TEAM_LEAD",
      departmentId: deptEng.id,
      managerId: phaniManager.id,
      isActive: true,
      joiningDate: new Date("2024-06-01"),
    },
  });

  // Assign Tharun as Lead of Core Engineering Team
  await prisma.team.update({
    where: { id: teamCore.id },
    data: { teamLeadId: tharunLead.id },
  });

  // Executive: Bhanu
  console.log("==> Creating Executive: Bhanu...");
  const bhanuExec = await prisma.user.create({
    data: {
      employeeId: "EMP004",
      email: "bhanu@worktrack.company",
      passwordHash,
      fullName: "Bhanu",
      jobTitle: "Senior Software Engineer",
      role: "EXECUTIVE",
      departmentId: deptEng.id,
      managerId: phaniManager.id,
      teamLeadId: tharunLead.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  // Executive: Naveen
  console.log("==> Creating Executive: Naveen...");
  const naveenExec = await prisma.user.create({
    data: {
      employeeId: "EMP005",
      email: "naveen@worktrack.company",
      passwordHash,
      fullName: "Naveen",
      jobTitle: "Full Stack Software Engineer",
      role: "EXECUTIVE",
      departmentId: deptEng.id,
      managerId: phaniManager.id,
      teamLeadId: tharunLead.id,
      isActive: true,
      joiningDate: new Date("2025-02-01"),
    },
  });

  // 7. Team Memberships
  await prisma.teamMembership.createMany({
    data: [
      { teamId: teamCore.id, userId: tharunLead.id },
      { teamId: teamCore.id, userId: bhanuExec.id },
      { teamId: teamCore.id, userId: naveenExec.id },
    ],
  });

  // 8. Create Project
  console.log("==> Creating Project: WorkTrack Platform...");
  const project1 = await prisma.project.create({
    data: {
      name: "WorkTrack Platform",
      code: "WT-CORE",
      description: "Employee work management & daily tracking platform",
      departmentId: deptEng.id,
      status: "ACTIVE",
    },
  });

  // 9. Create Sample Tasks
  console.log("==> Assigning Tasks...");
  const task1 = await prisma.task.create({
    data: {
      taskCode: "TSK-001",
      title: "Implement Core Feature APIs & Validations",
      description: "Build robust REST endpoints for daily activity reporting and validation logic.",
      projectId: project1.id,
      departmentId: deptEng.id,
      createdById: tharunLead.id,
      assignedTeamLeadId: tharunLead.id,
      priority: "HIGH",
      status: "IN_PROGRESS",
      startDate: new Date("2026-10-01"),
      dueDate: new Date("2026-10-20"),
      estimatedHours: 40,
      progressPercentage: 45,
    },
  });

  await prisma.taskAssignment.create({
    data: {
      taskId: task1.id,
      userId: bhanuExec.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      taskCode: "TSK-002",
      title: "Interactive Kanban Board & UI Components",
      description: "Develop responsive task management board with drag-and-drop status workflows.",
      projectId: project1.id,
      departmentId: deptEng.id,
      createdById: tharunLead.id,
      assignedTeamLeadId: tharunLead.id,
      priority: "MEDIUM",
      status: "TO_DO",
      startDate: new Date("2026-10-05"),
      dueDate: new Date("2026-10-25"),
      estimatedHours: 35,
      progressPercentage: 10,
    },
  });

  await prisma.taskAssignment.create({
    data: {
      taskId: task2.id,
      userId: naveenExec.id,
    },
  });

  // 10. Sample Daily Report (From Bhanu, ready for Tharun to review)
  console.log("==> Creating sample Daily Report for Bhanu...");
  const todayStr = new Date().toISOString().split("T")[0];
  const reportBhanu = await prisma.dailyReport.create({
    data: {
      userId: bhanuExec.id,
      reportingDate: new Date(todayStr),
      status: "SUBMITTED",
      submittedAt: new Date(),
      entries: {
        create: [
          {
            activityTitle: "REST API Endpoint Implementation",
            description: "Developed and verified endpoints for daily activity logging and status tracking.",
            taskId: task1.id,
            startTime: "09:30",
            endTime: "13:30",
            hoursSpent: 4.0,
            progressPercentage: 50,
            status: "IN_PROGRESS",
            deliverables: "Merged PR #14 with unit tests passing.",
            blockers: null,
            supportRequired: null,
            nextDayPlan: "Complete integration tests and connect review workflow.",
          },
          {
            activityTitle: "Code Review & Technical Documentation",
            description: "Participated in PR discussions and documented request/response payloads in OpenAPI.",
            startTime: "14:30",
            endTime: "18:00",
            hoursSpent: 3.5,
            progressPercentage: 100,
            status: "COMPLETED",
            deliverables: "Updated Swagger definitions.",
            blockers: null,
            supportRequired: null,
            nextDayPlan: "Begin UI integration.",
          },
        ],
      },
    },
  });

  // Notification for Tharun that Bhanu submitted a report
  await prisma.notification.create({
    data: {
      recipientId: tharunLead.id,
      senderId: bhanuExec.id,
      eventType: "DAILY_REPORT_SUBMITTED",
      title: "Daily Report Submitted",
      message: "Bhanu submitted their daily work report for today.",
      link: `/reports/${reportBhanu.id}`,
    },
  });

  // 11. Initial Announcements
  console.log("==> Creating initial Announcements...");
  await prisma.announcement.create({
    data: {
      title: "Welcome to WorkTrack Platform!",
      content: "All team members are now active. Please use the platform to record daily work reports, track tasks, and communicate via direct chat.",
      priority: "HIGH",
      targetScope: "ALL",
      isPinned: true,
      authorId: rahulAdmin.id,
    },
  });

  // 12. Initial Direct Chat Messages
  console.log("==> Creating sample Direct Chat Messages...");
  await prisma.chatMessage.createMany({
    data: [
      {
        senderId: tharunLead.id,
        receiverId: bhanuExec.id,
        content: "Hi Bhanu, welcome to the platform! Check out TSK-001 on your task board.",
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        senderId: bhanuExec.id,
        receiverId: tharunLead.id,
        content: "Thanks Tharun! I have submitted today's report for review as well.",
        isRead: true,
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        senderId: tharunLead.id,
        receiverId: naveenExec.id,
        content: "Hi Naveen! Let me know if you need any clarification on the Kanban board task.",
        isRead: false,
        createdAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  // 13. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: rahulAdmin.id,
      action: "TEAM_INITIALIZED",
      resourceType: "ORGANIZATION",
      detailsJson: JSON.stringify({
        note: "Configured custom team: Rahul (Admin), Phani (Manager), Tharun (Team Lead), Bhanu & Naveen (Executives)",
      }),
    },
  });

  console.log("==> Seed completed successfully!");
  console.log("=================================================");
  console.log("Your New Team is Live (Password: 'Matrix@4290'):");
  console.log("  👑 Admin:        rahul@worktrack.company   (or username: 'rahul')");
  console.log("  👔 Manager:      phani@worktrack.company   (or username: 'phani')");
  console.log("  🎯 Team Leader:  tharun@worktrack.company  (or username: 'tharun')");
  console.log("  💻 Executive 1:  bhanu@worktrack.company   (or username: 'bhanu')");
  console.log("  💻 Executive 2:  naveen@worktrack.company  (or username: 'naveen')");
  console.log("=================================================");
}

if (process.argv[1]?.includes("seed.ts") || process.argv[1]?.includes("seed.js")) {
  runSeed()
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
