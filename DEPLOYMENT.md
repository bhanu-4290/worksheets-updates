# WORKTRACK — ENTERPRISE PRODUCTION DEPLOYMENT GUIDE

This document describes how to deploy, configure, secure, and maintain the **WorkTrack** Employee Daily Work Tracking and Management platform within an internal enterprise company server, VPN, or on-premise infrastructure.

---

## 1. Architecture Overview

```
                      [Internal VPN / Corporate Network]
                                      │
                                      ▼
                        [Nginx Reverse Proxy / SSL]
                          (:80 / :443 HTTPS TLS 1.3)
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
    [React SPA Static Files]                     [Express API REST Gateway]
    (/usr/share/nginx/html)                           (Port :5000)
                                                              │
                                                              ▼
                                                   [PostgreSQL 16+ Database]
                                                          (Port :5432)
```

### Key Security & Network Features:
* **Network Isolation**: Accessible solely via internal company network subnets or company VPN gateway.
* **Authentication**: HTTP-only, SameSite, Secure cookies for JWT session tokens with deactivation revocation.
* **Role-Based Access**: Multi-tenant database schema enforced by strict middleware (`SUPER_ADMIN`, `MANAGER`, `TEAM_LEAD`, `EXECUTIVE`).
* **Rate Limiting**: Distributed rate-limiting protecting authentication routes and preventing brute-force attempts.
* **Audit Logging**: Comprehensive non-repudiation audit trail for all daily report approvals, corrections, escalations, and permission changes.

---

## 2. Server Prerequisites

* **Operating System**: Ubuntu 22.04 LTS / 24.04 LTS, Debian 12, or RHEL/Rocky Linux 9
* **Node.js**: v20.x LTS or higher
* **PostgreSQL**: v16+ (or Docker Engine 24+)
* **Nginx**: v1.22+
* **Process Manager**: PM2 (`npm install -g pm2`) or `systemd`

---

## 3. Option A: Deployment with Docker Compose (Recommended)

Docker Compose bundles PostgreSQL 16, the Express API, and Nginx in containerized services with health checks and persistent volume storage.

### 1. Clone repository on the server:
```bash
git clone <internal_git_repo_url> /opt/worktrack
cd /opt/worktrack
```

### 2. Configure Environment:
Create `/opt/worktrack/.env`:
```env
POSTGRES_USER=worktrack_admin
POSTGRES_PASSWORD=SetSecureEnterprisePassword2026!
POSTGRES_DB=worktrack_db
JWT_SECRET=generate_at_least_32_characters_random_hex_string_here
COOKIE_DOMAIN=worktrack.internal.company
CORS_ORIGIN=https://worktrack.internal.company
```

### 3. Build & Run Containers:
```bash
cd /opt/worktrack/deploy/docker
docker-compose up -d --build
```

### 4. Run Migrations & Database Seed:
```bash
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npm run seed
```

### 5. Verify Health:
```bash
curl http://localhost/health
```

---

## 4. Option B: Native Host Deployment (PM2 + Systemd + Nginx)

### 1. Database Setup
Create database and user in PostgreSQL:
```sql
CREATE DATABASE worktrack_db;
CREATE USER worktrack_admin WITH ENCRYPTED PASSWORD 'SetSecureEnterprisePassword2026!';
GRANT ALL PRIVILEGES ON DATABASE worktrack_db TO worktrack_admin;
```

### 2. Build Frontend and Backend:
```bash
# In server directory
cd /opt/worktrack/server
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run seed   # Initial bootstrap seed

# In client directory
cd /opt/worktrack/client
npm ci
npm run build  # Compiles to client/dist
```

### 3. Configure Systemd Service:
```bash
sudo cp /opt/worktrack/deploy/systemd/worktrack.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable worktrack
sudo systemctl start worktrack
sudo systemctl status worktrack
```

Or using **PM2**:
```bash
pm2 start /opt/worktrack/deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

### 4. Configure Nginx Reverse Proxy:
Copy configuration:
```bash
sudo cp /opt/worktrack/deploy/nginx/nginx.conf /etc/nginx/sites-available/worktrack.conf
sudo ln -s /etc/nginx/sites-available/worktrack.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. SSL / TLS Setup (Internal CA or Certbot)

For internal company networks, install the enterprise root/intermediate CA certificate:
```nginx
server {
    listen 443 ssl http2;
    server_name worktrack.internal.company;

    ssl_certificate /etc/nginx/ssl/worktrack.internal.company.crt;
    ssl_certificate_key /etc/nginx/ssl/worktrack.internal.company.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ...
}
```

---

## 6. Backup & Disaster Recovery Automation

Configure automated daily backups via Linux cron (`crontab -e`):
```bash
# Execute daily database backup at 02:00 AM
0 2 * * * /opt/worktrack/deploy/scripts/backup.sh >> /var/log/worktrack-backup.log 2>&1
```

To restore from a backup:
```bash
/opt/worktrack/deploy/scripts/restore.sh /opt/worktrack/backups/worktrack_backup_20261009_020000.sql.gz
```

---

## 7. Verification & Default Credentials

After initial deployment and seeding, verify all 4 role access flows:

| Role | Email | Default Password | Scope / Permissions |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `admin@worktrack.company` | `Password123!` | Full company visibility, Org configuration, Audit logs |
| **MANAGER** | `manager.eng@worktrack.company` | `Password123!` | Engineering department only, Blocker escalations |
| **TEAM_LEAD** | `lead.frontend@worktrack.company` | `Password123!` | Frontend team reviews, Task assignments |
| **EXECUTIVE** | `exec.dev1@worktrack.company` | `Password123!` | Daily work reports, Personal task execution |

* **API Health Check**: `GET http://localhost:5000/health`
* **OpenAPI Documentation**: `GET http://localhost:5000/api-docs`
* **Web UI Dashboard**: `GET http://localhost:5000/` or `http://localhost:3000/`
