import bcrypt from "bcryptjs";
import { initDatabase, prisma } from "../src/config/db.js";

export async function runSeed() {
  console.log("==> Running MATRIX Official Database Seed (28 Real Employees, No L1 Data)...");
  await initDatabase();

  const passwordHash = await bcrypt.hash("Matrix@123", 10);

  // 1. Company Settings
  await prisma.companySetting.deleteMany();
  await prisma.companySetting.create({
    data: {
      companyName: "MATRIX",
      timezone: "Asia/Kolkata",
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
      { name: "Republic Day", date: new Date("2026-01-26"), isRecurring: true },
      { name: "May Day", date: new Date("2026-05-01"), isRecurring: true },
      { name: "Independence Day", date: new Date("2026-08-15"), isRecurring: true },
      { name: "Gandhi Jayanti", date: new Date("2026-10-02"), isRecurring: true },
      { name: "Christmas Day", date: new Date("2026-12-25"), isRecurring: true },
    ],
  });

  // 3. Clean all previous transactional data
  console.log("==> Removing all previous transactional and employee records...");
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

  // 4. Create Departments
  console.log("==> Creating MATRIX Departments...");
  const deptExecutive = await prisma.department.create({
    data: {
      name: "MATRIX Executive & Operations",
      code: "MTX-EXEC",
      description: "MATRIX Executive Management & Platform Operations",
    },
  });

  const deptDCInfra = await prisma.department.create({
    data: {
      name: "DC Infra, EMS & Systems",
      code: "DC-INFRA",
      description: "Data Center Infrastructure, EMS, MIT, Servers, Storage & Network",
    },
  });

  const deptAnalytics = await prisma.department.create({
    data: {
      name: "Analytics, VMS & CCTV 360",
      code: "VMS-CCTV",
      description: "Video Management Systems, Analytics, and CCTV 360 Co-ordination",
    },
  });

  const deptDCOpsTech = await prisma.department.create({
    data: {
      name: "DC Operations & Tech Support",
      code: "DC-TECH",
      description: "DC Manager 3 and CCTV 360 Technical Support",
    },
  });

  const deptDCOpsVMS = await prisma.department.create({
    data: {
      name: "DC Operations & VMS",
      code: "DC-VMS",
      description: "DC Manager 3 and Video Management Operations",
    },
  });

  const deptDCOpsEMS = await prisma.department.create({
    data: {
      name: "DC Operations & EMS",
      code: "DC-EMS",
      description: "DC Manager 3 and Enterprise Management Systems",
    },
  });

  const deptDCOpsNet = await prisma.department.create({
    data: {
      name: "DC Operations & Network",
      code: "DC-NET",
      description: "DC Manager 3 and Network Infrastructure Operations",
    },
  });

  // 5. TIER 1: Super Admin (YELLOW)
  console.log("==> Creating Super Admin (Sri Aditya - Yellow)...");
  const sriAdityaAdmin = await prisma.user.create({
    data: {
      employeeId: "M-000925",
      fullName: "Sri Aditya Canuparthi",
      email: "sriaditya.c@matrixst.in",
      passwordHash,
      jobTitle: "Super Administrator & Managing Director",
      role: "SUPER_ADMIN",
      departmentId: deptExecutive.id,
      isActive: true,
      joiningDate: new Date("2023-01-01"),
    },
  });

  // 6. TIER 2: Department Managers (ORANGE) reporting to Sri Aditya
  console.log("==> Creating Department Managers (Orange)...");

  // Manager: Rahul Kiran Darnasi
  const rahulMgr = await prisma.user.create({
    data: {
      employeeId: "M-000844",
      fullName: "Rahul Kiran Darnasi",
      email: "rahul.d@matrixst.in",
      passwordHash,
      jobTitle: "Manager (DC infra / EMS / MIT / DC krishna)",
      role: "MANAGER",
      departmentId: deptDCInfra.id,
      managerId: sriAdityaAdmin.id,
      isActive: true,
      joiningDate: new Date("2024-01-01"),
    },
  });

  // Manager: Madhu Bhushan
  const madhuBhushanMgr = await prisma.user.create({
    data: {
      employeeId: "M-000103",
      fullName: "K.Madhu Bhushana Rao",
      email: "madhu.k@matrixst.in",
      passwordHash,
      jobTitle: "Manager (Analytics / VMS & CCTV 360)",
      role: "MANAGER",
      departmentId: deptAnalytics.id,
      managerId: sriAdityaAdmin.id,
      isActive: true,
      joiningDate: new Date("2024-01-01"),
    },
  });

  // Manager: Akhil Babu
  const akhilMgr = await prisma.user.create({
    data: {
      employeeId: "M-000233",
      fullName: "Uppada Akhil Babu",
      email: "akhil.b@matrixst.in",
      passwordHash,
      jobTitle: "Manager (DC Manager -3 & CCTV 360 Tech)",
      role: "MANAGER",
      departmentId: deptDCOpsTech.id,
      managerId: sriAdityaAdmin.id,
      isActive: true,
      joiningDate: new Date("2024-01-01"),
    },
  });

  // Manager: Madhusudhan
  const madhusudhanMgr = await prisma.user.create({
    data: {
      employeeId: "M-000815",
      fullName: "Lankapalli Madhusudhanarao",
      email: "madhusudhanarao.l@matrixst.in",
      passwordHash,
      jobTitle: "Manager (DC Manager -3 & VMS)",
      role: "MANAGER",
      departmentId: deptDCOpsVMS.id,
      managerId: sriAdityaAdmin.id,
      isActive: true,
      joiningDate: new Date("2024-01-01"),
    },
  });

  // Manager: Phaneeshwarnadh
  const phaniMgr = await prisma.user.create({
    data: {
      employeeId: "M-000899",
      fullName: "A V Phaneeswaranadh",
      email: "phaneeswaranadh.a@matrixst.in",
      passwordHash,
      jobTitle: "Manager (DC Manager -3 & EMS)",
      role: "MANAGER",
      departmentId: deptDCOpsEMS.id,
      managerId: sriAdityaAdmin.id,
      isActive: true,
      joiningDate: new Date("2024-01-01"),
    },
  });

  // Manager: Jagan Mohan
  const jaganMgr = await prisma.user.create({
    data: {
      employeeId: "M-000903",
      fullName: "Dk Jagan Mohan",
      email: "jagan@matrixst.in",
      passwordHash,
      jobTitle: "Manager (DC Manager -3 & Network)",
      role: "MANAGER",
      departmentId: deptDCOpsNet.id,
      managerId: sriAdityaAdmin.id,
      isActive: true,
      joiningDate: new Date("2024-01-01"),
    },
  });

  // Sub-Managers under Rahul (Orange):
  // Rajesh (Servers / Storage)
  const rajeshMgr = await prisma.user.create({
    data: {
      employeeId: "M-000763",
      fullName: "Mattaparthi Rajesh",
      email: "rajesh.m@matrixst.in",
      passwordHash,
      jobTitle: "Manager (Servers / Storage)",
      role: "MANAGER",
      departmentId: deptDCInfra.id,
      managerId: rahulMgr.id,
      isActive: true,
      joiningDate: new Date("2024-02-01"),
    },
  });

  // Venkateshwarlu (Network)
  const venkateshwarluMgr = await prisma.user.create({
    data: {
      employeeId: "M-000898",
      fullName: "G Venkateswarlu",
      email: "venkateswarlu.g@matrixst.in",
      passwordHash,
      jobTitle: "Manager (Network)",
      role: "MANAGER",
      departmentId: deptDCInfra.id,
      managerId: rahulMgr.id,
      isActive: true,
      joiningDate: new Date("2024-02-01"),
    },
  });

  // Link Managers to Departments
  await prisma.department.update({ where: { id: deptExecutive.id }, data: { managerId: sriAdityaAdmin.id } });
  await prisma.department.update({ where: { id: deptDCInfra.id }, data: { managerId: rahulMgr.id } });
  await prisma.department.update({ where: { id: deptAnalytics.id }, data: { managerId: madhuBhushanMgr.id } });
  await prisma.department.update({ where: { id: deptDCOpsTech.id }, data: { managerId: akhilMgr.id } });
  await prisma.department.update({ where: { id: deptDCOpsVMS.id }, data: { managerId: madhusudhanMgr.id } });
  await prisma.department.update({ where: { id: deptDCOpsEMS.id }, data: { managerId: phaniMgr.id } });
  await prisma.department.update({ where: { id: deptDCOpsNet.id }, data: { managerId: jaganMgr.id } });

  // 7. TIER 3: The 19 DC Team Leads & Specialists (Green)
  console.log("==> Creating 19 DC Team Leads & Specialists (Green)...");

  // Under Rahul: Surya (EMS)
  await prisma.user.create({
    data: {
      employeeId: "M-000829",
      fullName: "Gondu Appalasuryanarayana",
      email: "suryanarayana.g@matrixst.in",
      passwordHash,
      jobTitle: "Surya (EMS Lead)",
      role: "TEAM_LEAD",
      departmentId: deptDCInfra.id,
      managerId: rahulMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  // Under Rajesh: Gopi & Manoj
  await prisma.user.create({
    data: {
      employeeId: "M-000805",
      fullName: "Kakani Gopinath",
      email: "gopinath.k@matrixst.in",
      passwordHash,
      jobTitle: "Storage Specialist (Gopi)",
      role: "EXECUTIVE",
      departmentId: deptDCInfra.id,
      managerId: rajeshMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000849",
      fullName: "Guttula Devi Naga Manoj",
      email: "nagamanoj.g@gmail.com",
      passwordHash,
      jobTitle: "Server Specialist (Manoj)",
      role: "EXECUTIVE",
      departmentId: deptDCInfra.id,
      managerId: rajeshMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  // Under Venkateshwarlu: Surrendra, Prasanna, Rasi
  await prisma.user.create({
    data: {
      employeeId: "M-000708",
      fullName: "Thunuguntla Naga Venkata Surendra",
      email: "surendratnv@gmail.com",
      passwordHash,
      jobTitle: "Network Engineer (Surrendra)",
      role: "TEAM_LEAD",
      departmentId: deptDCInfra.id,
      managerId: venkateshwarluMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000589",
      fullName: "Tanneeru Lakshmi Prasanna Kumar",
      email: "prasannakumartanneeru@gmail.com",
      passwordHash,
      jobTitle: "DC Operations (Prasanna)",
      role: "EXECUTIVE",
      departmentId: deptDCInfra.id,
      managerId: venkateshwarluMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000831",
      fullName: "Gangula Rasi",
      email: "gangularasi4@gmail.com",
      passwordHash,
      jobTitle: "DC Operations (Rasi)",
      role: "EXECUTIVE",
      departmentId: deptDCInfra.id,
      managerId: venkateshwarluMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  // Under Akhil: Kavya & Dharanidhar
  await prisma.user.create({
    data: {
      employeeId: "M-000862",
      fullName: "Chikkam Kavya Asha Swaroopa",
      email: "chikkamkavya64@gmail.com",
      passwordHash,
      jobTitle: "DC Operations Lead (Kavya)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsTech.id,
      managerId: akhilMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000431",
      fullName: "Pendyala Dharanidhar",
      email: "dharanidhar.p@matrixst.in",
      passwordHash,
      jobTitle: "DC Operations Lead (Dharanidhar)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsTech.id,
      managerId: akhilMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  // Under Madhu sudhan: Sangeetha, Bhavya, Veeranjaneyulu, Mohan, DRK Raju
  await prisma.user.create({
    data: {
      employeeId: "M-000846",
      fullName: "Nadimpalli Soma Sangeetha",
      email: "somaviharika@gmail.com",
      passwordHash,
      jobTitle: "DC Operations Lead (Sangeetha)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsVMS.id,
      managerId: madhusudhanMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000842",
      fullName: "Mamidala Bhavya Naga Sri Sai Krupa Veeramani",
      email: "bhavyamamidala10@gmail.com",
      passwordHash,
      jobTitle: "DC Operations Lead (Bhavya)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsVMS.id,
      managerId: madhusudhanMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000857",
      fullName: "Jetti Veeranjaneyulu",
      email: "veeranjaneyulu81584@gmail.com",
      passwordHash,
      jobTitle: "DC Specialist (Veeranjaneyulu)",
      role: "EXECUTIVE",
      departmentId: deptDCOpsVMS.id,
      managerId: madhusudhanMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000645",
      fullName: "Danaboina Mohankrishna",
      email: "mohankrishnadanaboina09@gmail.com",
      passwordHash,
      jobTitle: "DC Specialist (Mohan)",
      role: "EXECUTIVE",
      departmentId: deptDCOpsVMS.id,
      managerId: madhusudhanMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000839",
      fullName: "Datla Ramakrishnam Raju",
      email: "drkraju.1990@gmail.com",
      passwordHash,
      jobTitle: "DC Specialist (DRK Raju)",
      role: "EXECUTIVE",
      departmentId: deptDCOpsVMS.id,
      managerId: madhusudhanMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  // Under Phaneeshwarnadh: Naveen, Tharun, Bhanu
  await prisma.user.create({
    data: {
      employeeId: "M-000764",
      fullName: "Jannu Raja Naveen",
      email: "jannurajanaveen@gmail.com",
      passwordHash,
      jobTitle: "DC Operations Lead (Naveen)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsEMS.id,
      managerId: phaniMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000620",
      fullName: "Koppolu Thanru Tej",
      email: "tharun.k@matrixst.in",
      passwordHash,
      jobTitle: "DC Operations Lead (Tharun)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsEMS.id,
      managerId: phaniMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000894",
      fullName: "G Bhanu Kiran",
      email: "gbhanu2811@gmail.com",
      passwordHash,
      jobTitle: "DC Operations Lead (Bhanu)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsEMS.id,
      managerId: phaniMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  // Under Jagan: Lokesh, Bhagawan, Pawan
  await prisma.user.create({
    data: {
      employeeId: "M-000880",
      fullName: "Baji Lokesh",
      email: "lokeshbaji85@gmail.com",
      passwordHash,
      jobTitle: "DC Network Lead (Lokesh)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsNet.id,
      managerId: jaganMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000658",
      fullName: "Kruttiventi Bhagavan",
      email: "bhagavanbittu@gmail.com",
      passwordHash,
      jobTitle: "DC Network Lead (Bhagawan)",
      role: "TEAM_LEAD",
      departmentId: deptDCOpsNet.id,
      managerId: jaganMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  await prisma.user.create({
    data: {
      employeeId: "M-000697",
      fullName: "N.Venkata Sai Pavan Kumar Reddy",
      email: "saipavan.r@matrixst.in",
      passwordHash,
      jobTitle: "DC Network Specialist (Pawan)",
      role: "EXECUTIVE",
      departmentId: deptDCOpsNet.id,
      managerId: jaganMgr.id,
      isActive: true,
      joiningDate: new Date("2025-01-10"),
    },
  });

  // 8. Projects (Removed - no projects seeded)
  console.log("==> Skipping Project creation (Projects data removed)...");

  // 9. Initial Welcome Announcement
  console.log("==> Creating Welcome Announcement...");
  await prisma.announcement.create({
    data: {
      title: "Welcome to MATRIX SYNC SPACE Portal",
      content: "All 28 verified employee accounts are now active. Employees can edit their profile details and date of birth in My Account. Daily task sheets are blank till 15-10-2026. For support, contact gbhanu2811@gmail.com or 7337504290.",
      priority: "HIGH",
      targetScope: "ALL",
      isPinned: true,
      authorId: sriAdityaAdmin.id,
    },
  });

  // 10. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: sriAdityaAdmin.id,
      action: "HIERARCHY_INITIALIZED",
      resourceType: "ORGANIZATION",
      detailsJson: JSON.stringify({
        organization: "MATRIX",
        superAdmin: "Sri Aditya Canuparthi",
        totalEmployees: 28,
        l1Removed: true,
        calendarBlankTill: "2026-10-15",
      }),
    },
  });

  const totalUsers = await prisma.user.count();
  console.log(`==> Seed finished successfully! Total users created: ${totalUsers} (All 28 MATRIX employees, 0 L1 accounts)`);
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
