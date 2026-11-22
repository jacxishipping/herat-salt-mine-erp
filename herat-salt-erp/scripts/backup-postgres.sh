#!/usr/bin/env bash
# ============================================================================
# Herat Salt Mine ERP — Automated Daily PostgreSQL Backup Script
# Retention: 30 days (gzip-compressed SQL dumps for local NAS / USB / Cloud)
# Cron example (02:00 AM daily):
#   0 2 * * * /opt/herat-salt-erp/scripts/backup-postgres.sh >> /var/log/erp-backup.log 2>&1
# ============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
DATABASE_URL="${DATABASE_URL:-postgres://erp_admin:change_me_strong_password@localhost:5432/herat_salt_erp}"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT_FILE="${BACKUP_DIR}/herat_salt_erp_${STAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"
echo "[$(date -Iseconds)] Starting PostgreSQL backup -> ${OUT_FILE}"
pg_dump "${DATABASE_URL}" --no-owner --no-privileges | gzip -9 > "${OUT_FILE}"
sha256sum "${OUT_FILE}" > "${OUT_FILE}.sha256"

# Prune backups older than 30 days
find "${BACKUP_DIR}" -type f -name "herat_salt_erp_*.sql.gz*" -mtime +30 -delete
echo "[$(date -Iseconds)] Backup complete ($(du -h "${OUT_FILE}" | cut -f1))."
