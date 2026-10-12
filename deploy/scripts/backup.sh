#!/usr/bin/env bash
# WorkTrack Database Backup Script
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/worktrack/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${POSTGRES_DB:-worktrack_db}"
DB_USER="${POSTGRES_USER:-worktrack_admin}"
BACKUP_FILE="${BACKUP_DIR}/worktrack_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting database backup for '${DB_NAME}'..."
pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

echo "[SUCCESS] Backup created at: ${BACKUP_FILE}"
echo "[INFO] Size: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Keep only the last 30 daily backups
find "${BACKUP_DIR}" -name "worktrack_backup_*.sql.gz" -mtime +30 -exec rm {} \;
echo "[INFO] Rotated backups older than 30 days."
