# WorkTrack — Employee Daily Work Tracking & Management System

WorkTrack is a secure, full-stack enterprise web application designed for organizations to track daily employee activities, review reports, manage team tasks, handle blocker escalations, and communicate via internal direct chat and company announcements.

---

## 🚀 Key Features

* **4-Tier Organizational Hierarchy**: Super Admin &rarr; Manager &rarr; Team Lead &rarr; Executive.
* **Daily Work Reporting**: Multi-entry activities, optional hours tracking, draft saving, resubmissions, and review history.
* **Strict Scope Isolation**: Department-level and team-level access boundaries.
* **Review Queue Workflow**: Team Leads acknowledge or request revisions with mandatory comments.
* **Task Management**: Independent Kanban board and filterable table views with status workflows.
* **Blocker Escalations**: Cross-team blocker reporting, lead-to-manager escalation, and resolution tracking.
* **Internal 1-on-1 Direct Chat**: Real-time messaging between colleagues with read receipts and unread badges.
* **Company & Team Announcements**: Broadcast bulletins with priority levels (`URGENT`, `HIGH`, `NORMAL`) and pinning.
* **Audit Trail**: Immutable system audit logging for administrative actions and governance.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Lucide Icons, Recharts.
* **Backend**: Node.js, Express, TypeScript, JWT (HTTP-only cookies / Bearer), Argon2/Bcrypt, Zod validation, Swagger OpenAPI.
* **Database**: PostgreSQL with Prisma ORM (supported via native PostgreSQL or zero-friction PGlite engine).

---

## 🏃 Getting Started Locally

### 1. Install Dependencies
```bash
# In server directory
cd server
npm install

# In client directory
cd ../client
npm install
```

### 2. Initialize Database & Seed
```bash
cd server
npm run build
npm run seed
```

### 3. Run Applications
```bash
# Start backend API (Port 5000)
cd server
npm run dev

# Start frontend Vite client (Port 3000)
cd client
npm run dev
```

Visit the app at: **http://localhost:3000** (or **http://localhost:5000**)  
API Swagger Documentation: **http://localhost:5000/api-docs**

---

## 👥 Default Team Accounts

All accounts use the default password: **`Matrix@4290`**

| Role | Name | Username / Email |
| :--- | :--- | :--- |
| **Super Admin** | Rahul | `rahul` *(or `rahul@worktrack.company`)* |
| **Manager** | Phani | `phani` *(or `phani@worktrack.company`)* |
| **Team Leader** | Tharun | `tharun` *(or `tharun@worktrack.company`)* |
| **Executive** | Bhanu | `bhanu` *(or `bhanu@worktrack.company`)* |
| **Executive** | Naveen | `naveen` *(or `naveen@worktrack.company`)* |

---

## 📦 Production Deployment

Refer to [`DEPLOYMENT.md`](./DEPLOYMENT.md) for Docker Compose, Nginx reverse proxy, and systemd production deployment guides.
