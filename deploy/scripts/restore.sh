#!/usr/bin/env bash
# WorkTrack Database Restore Script
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${POSTGRES_DB:-worktrack_db}"
DB_USER="${POSTGRES_USER:-worktrack_admin}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file '${BACKUP_FILE}' does not exist."
  exit 1
fi

echo "[WARNING] This will overwrite database '${DB_NAME}' with data from '${BACKUP_FILE}'."
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "[INFO] Restore cancelled."
  exit 0
fi

echo "[INFO] Restoring database '${DB_NAME}'..."
gunzip -c "${BACKUP_FILE}" | psql -U "${DB_USER}" -d "${DB_NAME}"

echo "[SUCCESS] Database restored successfully from '${BACKUP_FILE}'."
