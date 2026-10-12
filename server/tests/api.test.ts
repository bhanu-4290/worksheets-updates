import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { initDatabase, prisma } from "../src/config/db.js";
import { runSeed } from "../prisma/seed.js";

let adminToken: string;
let managerEngToken: string;
let managerProdToken: string;
let leadFrontendToken: string;
let leadMobileToken: string;
let execAlexToken: string;
let execMayaToken: string;

beforeAll(async () => {
  await initDatabase();
  await runSeed();

  // Login as Super Admin
  const resAdmin = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "admin@worktrack.company", password: "Matrix@4290" });
  expect(resAdmin.status).toBe(200);
  adminToken = resAdmin.body.data.token;

  // Login as Engineering Manager
  const resMgrEng = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "manager.eng@worktrack.company", password: "Matrix@4290" });
  expect(resMgrEng.status).toBe(200);
  managerEngToken = resMgrEng.body.data.token;

  // Login as Product Manager
  const resMgrProd = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "manager.prod@worktrack.company", password: "Matrix@4290" });
  expect(resMgrProd.status).toBe(200);
  managerProdToken = resMgrProd.body.data.token;

  // Login as Frontend Lead
  const resLeadFE = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "lead.frontend@worktrack.company", password: "Matrix@4290" });
  expect(resLeadFE.status).toBe(200);
  leadFrontendToken = resLeadFE.body.data.token;

  // Login as Mobile Lead
  const resLeadMob = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "lead.mobile@worktrack.company", password: "Matrix@4290" });
  expect(resLeadMob.status).toBe(200);
  leadMobileToken = resLeadMob.body.data.token;

  // Login as Alex Rivera (Executive - Eng)
  const resAlex = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "exec.dev1@worktrack.company", password: "Matrix@4290" });
  expect(resAlex.status).toBe(200);
  execAlexToken = resAlex.body.data.token;

  // Login as Maya Patel (Executive - Eng)
  const resMaya = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "exec.dev2@worktrack.company", password: "Matrix@4290" });
  expect(resMaya.status).toBe(200);
  execMayaToken = resMaya.body.data.token;
});

describe("1. Authentication & Session Security", () => {
  it("authenticates active users and provides profile via /auth/me", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${execAlexToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("exec.dev1@worktrack.company");
    expect(res.body.data.user.role).toBe("EXECUTIVE");
  });

  it("denies access when unauthenticated", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("revokes access immediately if account is deactivated (Workflow 12)", async () => {
    // Create temporary user and deactivate
    const alex = await prisma.user.findUnique({ where: { email: "exec.dev1@worktrack.company" } });
    await prisma.user.update({ where: { id: alex!.id }, data: { isActive: false } });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${execAlexToken}`);

    expect(res.status).toBe(401);

    // Re-activate
    await prisma.user.update({ where: { id: alex!.id }, data: { isActive: true } });
  });
});

describe("2. Organizational Management & Scope Isolation", () => {
  it("allows Super Admin to create department and team (Workflow 1)", async () => {
    const deptRes = await request(app)
      .post("/api/v1/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Quality Assurance & SecOps",
        code: "QA-SEC",
        description: "Automated QA and Security Operations",
      });

    expect(deptRes.status).toBe(201);
    const deptId = deptRes.body.data.id;

    const teamRes = await request(app)
      .post("/api/v1/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Security Auditing",
        code: "QA-SEC-AUDIT",
        departmentId: deptId,
      });

    expect(teamRes.status).toBe(201);
  });

  it("denies Manager access to unrelated department (Workflow 8)", async () => {
    // Eng Manager tries to create a team in Product Department
    const prodDept = await prisma.department.findUnique({ where: { code: "PROD" } });

    const res = await request(app)
      .post("/api/v1/teams")
      .set("Authorization", `Bearer ${managerEngToken}`)
      .send({
        name: "Intruder Team",
        code: "INTRUDER",
        departmentId: prodDept!.id,
      });

    expect(res.status).toBe(403);
  });

  it("denies Team Lead access to unrelated team (Workflow 9)", async () => {
    // Mobile Team Lead tries to add member to Frontend Core team
    const feTeam = await prisma.team.findUnique({ where: { code: "ENG-FE" } });
    const alex = await prisma.user.findUnique({ where: { email: "exec.dev1@worktrack.company" } });

    const res = await request(app)
      .post(`/api/v1/teams/${feTeam!.id}/members`)
      .set("Authorization", `Bearer ${leadMobileToken}`)
      .send({ userId: alex!.id });

    expect(res.status).toBe(403);
  });
});

describe("3. Task Assignment & Workflow", () => {
  it("allows Team Lead to assign a task to an Executive (Workflow 2)", async () => {
    const proj = await prisma.project.findUnique({ where: { code: "WT-CORE" } });
    const dept = await prisma.department.findUnique({ where: { code: "ENG" } });
    const alex = await prisma.user.findUnique({ where: { email: "exec.dev1@worktrack.company" } });

    const res = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${leadFrontendToken}`)
      .send({
        title: "Build Responsive Topbar Navigation",
        description: "Implement mobile hamburger drawer and responsive layout",
        projectId: proj!.id,
        departmentId: dept!.id,
        assignedUserIds: [alex!.id],
        priority: "HIGH",
        estimatedHours: 8.0,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.taskCode).toMatch(/^TSK-/);
  });

  it("prevents Executives from creating managed tasks", async () => {
    const proj = await prisma.project.findUnique({ where: { code: "WT-CORE" } });
    const dept = await prisma.department.findUnique({ where: { code: "ENG" } });
    const alex = await prisma.user.findUnique({ where: { email: "exec.dev1@worktrack.company" } });

    const res = await request(app)
      .post("/api/v1/tasks")
      .set("Authorization", `Bearer ${execAlexToken}`)
      .send({
        title: "Unauthorized Task",
        description: "Attempt by executive to create task",
        projectId: proj!.id,
        departmentId: dept!.id,
        assignedUserIds: [alex!.id],
      });

    expect(res.status).toBe(403);
  });
});

describe("4. Daily Report Reporting & Optional Hours", () => {
  it("allows Executive to submit a daily report with optional hours omitted (Workflow 3)", async () => {
    const futureDate = "2026-10-15";

    const res = await request(app)
      .post("/api/v1/daily-reports")
      .set("Authorization", `Bearer ${execAlexToken}`)
      .send({
        reportingDate: futureDate,
        status: "SUBMITTED",
        entries: [
          {
            activityTitle: "Architecture and Accessibility Documentation",
            description: "Wrote WCAG 2.1 compliance guidelines for the team",
            progressPercentage: 100,
            status: "COMPLETED",
            deliverables: "Design System Guidelines v1.0",
            // hoursSpent omitted intentionally!
          },
        ],
      });

    expect(res.status).toBe(200);

    const reportRes = await request(app)
      .get(`/api/v1/daily-reports/${res.body.data.id}`)
      .set("Authorization", `Bearer ${execAlexToken}`);

    expect(reportRes.status).toBe(200);
    expect(reportRes.body.data.status).toBe("SUBMITTED");
    expect(reportRes.body.data.entries[0].hoursSpent).toBeNull();
  });

  it("enforces single report per employee per date in the database (Workflow 15)", async () => {
    // When saving again for the same date, it updates the existing report instead of creating a duplicate
    const alex = await prisma.user.findUnique({ where: { email: "exec.dev1@worktrack.company" } });
    const targetDate = "2026-10-16";

    // 1st save
    const res1 = await request(app)
      .post("/api/v1/daily-reports")
      .set("Authorization", `Bearer ${execAlexToken}`)
      .send({
        reportingDate: targetDate,
        status: "DRAFT",
        entries: [
          {
            activityTitle: "Draft work entry 1",
            description: "Working on draft",
          },
        ],
      });

    // 2nd save
    const res2 = await request(app)
      .post("/api/v1/daily-reports")
      .set("Authorization", `Bearer ${execAlexToken}`)
      .send({
        reportingDate: targetDate,
        status: "DRAFT",
        entries: [
          {
            activityTitle: "Draft work entry 1 updated",
            description: "Updated draft description",
          },
          {
            activityTitle: "Draft work entry 2 added",
            description: "Second entry added",
          },
        ],
      });

    expect(res1.body.data.id).toBe(res2.body.data.id);

    const count = await prisma.dailyReport.count({
      where: {
        userId: alex!.id,
        reportingDate: new Date(targetDate),
      },
    });

    expect(count).toBe(1);
  });

  it("denies Executive access to another employee's private report (Workflow 10)", async () => {
    // Maya tries to view Alex's report
    const alex = await prisma.user.findUnique({ where: { email: "exec.dev1@worktrack.company" } });
    const alexReport = await prisma.dailyReport.findFirst({ where: { userId: alex!.id } });

    const res = await request(app)
      .get(`/api/v1/daily-reports/${alexReport!.id}`)
      .set("Authorization", `Bearer ${execMayaToken}`);

    expect(res.status).toBe(403);
  });
});

describe("5. Daily Report Review Workflow & Strict Restrictions", () => {
  it("prohibits users from approving their own reports (Workflow 11)", async () => {
    // Team Lead David Kim submits a report for themselves and tries to approve it
    const today = "2026-10-20";
    const leadReport = await request(app)
      .post("/api/v1/daily-reports")
      .set("Authorization", `Bearer ${leadFrontendToken}`)
      .send({
        reportingDate: today,
        status: "SUBMITTED",
        entries: [
          {
            activityTitle: "Sprint Planning & Code Review",
            description: "Reviewed 5 pull requests",
            hoursSpent: 5.0,
          },
        ],
      });

    const reportId = leadReport.body.data.id;

    // David Kim tries to approve their own report
    const approveRes = await request(app)
      .post(`/api/v1/reviews/${reportId}/approve`)
      .set("Authorization", `Bearer ${leadFrontendToken}`)
      .send({ comments: "Self approval attempt" });

    expect(approveRes.status).toBe(403);
    expect(approveRes.body.message).toContain("cannot approve or review your own daily report");
  });

  it("Team Lead reviews and acknowledges subordinate report (Workflow 4)", async () => {
    const alex = await prisma.user.findUnique({ where: { email: "exec.dev1@worktrack.company" } });
    const date = "2026-10-21";

    const rep = await request(app)
      .post("/api/v1/daily-reports")
      .set("Authorization", `Bearer ${execAlexToken}`)
      .send({
        reportingDate: date,
        status: "SUBMITTED",
        entries: [
          {
            activityTitle: "Feature complete",
            description: "Completed frontend tasks",
            hoursSpent: 7.0,
          },
        ],
      });

    const reportId = rep.body.data.id;

    const reviewRes = await request(app)
      .post(`/api/v1/reviews/${reportId}/approve`)
      .set("Authorization", `Bearer ${leadFrontendToken}`)
      .send({ comments: "Great work, approved without modifications." });

    expect(reviewRes.status).toBe(200);

    const checked = await prisma.dailyReport.findUnique({ where: { id: reportId } });
    expect(checked!.status).toBe("APPROVED");
  });

  it("Team Lead requests correction and employee resubmits with revision snapshot (Workflow 5)", async () => {
    const date = "2026-10-22";

    const rep = await request(app)
      .post("/api/v1/daily-reports")
      .set("Authorization", `Bearer ${execAlexToken}`)
      .send({
        reportingDate: date,
        status: "SUBMITTED",
        entries: [
          {
            activityTitle: "Initial work",
            description: "Vague description without deliverables",
          },
        ],
      });

    const reportId = rep.body.data.id;

    // Lead requests correction
    const revRes = await request(app)
      .post(`/api/v1/reviews/${reportId}/request-revision`)
      .set("Authorization", `Bearer ${leadFrontendToken}`)
      .send({ comments: "Please specify concrete deliverables and PR links." });

    expect(revRes.status).toBe(200);

    const checkedRev = await prisma.dailyReport.findUnique({ where: { id: reportId } });
    expect(checkedRev!.status).toBe("REVISION_REQUESTED");

    // Employee resubmits with revised entries
    const resubmitRes = await request(app)
      .post(`/api/v1/daily-reports/${reportId}/resubmit`)
      .set("Authorization", `Bearer ${execAlexToken}`)
      .send({
        reason: "Added PR links and clarified test results",
        entries: [
          {
            activityTitle: "Initial work revised",
            description: "Completed PR #456 with unit test coverage and benchmark results",
            deliverables: "PR #456 merged",
          },
        ],
      });

    expect(resubmitRes.status).toBe(200);

    const checkedResubmit = await prisma.dailyReport.findUnique({ where: { id: reportId } });
    expect(checkedResubmit!.status).toBe("SUBMITTED");

    // Verify revision history snapshot exists
    const history = await prisma.reportRevisionHistory.findMany({ where: { dailyReportId: reportId } });
    expect(history.length).toBe(1);
    expect(history[0].snapshotJson).toContain("Vague description");
  });
});

describe("6. Manager Dashboard & Blocker Escalation", () => {
  it("Manager views department reporting compliance and metrics (Workflow 6)", async () => {
    const res = await request(app)
      .get("/api/v1/analytics/dashboard")
      .set("Authorization", `Bearer ${managerEngToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("MANAGER");
    expect(res.body.data.departmentEmployeeCount).toBeGreaterThan(0);
    expect(res.body.data.teamsCount).toBeGreaterThan(0);
  });

  it("Manager acknowledges and resolves an escalated blocker (Workflow 7)", async () => {
    const dept = await prisma.department.findUnique({ where: { code: "ENG" } });
    const mgr = await prisma.user.findUnique({ where: { email: "manager.eng@worktrack.company" } });

    // Team Lead creates escalation
    const escRes = await request(app)
      .post("/api/v1/escalations")
      .set("Authorization", `Bearer ${leadFrontendToken}`)
      .send({
        title: "Test DB Cluster Connection Limit Reached",
        description: "Connections are maxing out at 100 during stress testing",
        urgency: "CRITICAL",
        departmentId: dept!.id,
      });

    expect(escRes.status).toBe(201);
    const escId = escRes.body.data.id;

    // Manager resolves escalation
    const resolveRes = await request(app)
      .patch(`/api/v1/escalations/${escId}/resolve`)
      .set("Authorization", `Bearer ${managerEngToken}`)
      .send({
        status: "RESOLVED",
        assignedOwnerId: mgr!.id,
        resolutionNotes: "Increased pgBouncer connection pool max limit to 300.",
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe("RESOLVED");
  });
});

describe("7. Compliance & Export Scoping", () => {
  it("calculates compliance excluding weekends and holidays (Workflow 14)", async () => {
    const res = await request(app)
      .get("/api/v1/analytics/compliance?startDate=2026-10-01&endDate=2026-10-07")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.workingDays).toBeLessThanOrEqual(5); // 7 calendar days has 5 workdays
    expect(res.body.data.results.length).toBeGreaterThan(0);
  });

  it("strictly scopes CSV exports so Managers only get department data (Workflow 13)", async () => {
    const res = await request(app)
      .get("/api/v1/users/export-csv")
      .set("Authorization", `Bearer ${managerEngToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("Engineering");
    // Should NOT contain Product department members
    expect(res.text).not.toContain("Product & Operations");
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
