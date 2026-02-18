#!/bin/bash

# AROS Voice Dashboard - Database Backup Script
set -e

SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-your-project-id}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/aros_backup_${DATE}.sql"

echo "Starting AROS Database Backup..."

mkdir -p "$BACKUP_DIR"

if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it."
    exit 1
fi

supabase db dump --project-ref "$SUPABASE_PROJECT_ID" --file "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    gzip "$BACKUP_FILE"
    echo "Backup successful: ${BACKUP_FILE}.gz"
    
    # Clean old backups
    find "$BACKUP_DIR" -name "aros_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
else
    echo "Backup failed!"
    exit 1
fi
