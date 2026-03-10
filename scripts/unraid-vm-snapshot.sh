#!/bin/bash
# Back up Coolify config from VM
BACKUP_DIR="/mnt/user/backups/coolify"
KEEP=4

mkdir -p "$BACKUP_DIR"
ssh coolify "tar czf - /data/coolify" > "$BACKUP_DIR/coolify-$(date +%Y%m%d-%H%M).tar.gz"

# Delete old backups
ls -t "$BACKUP_DIR"/coolify-*.tar.gz | tail -n +$((KEEP+1)) | xargs rm -f
