#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

: "${DATABASE_URL:?Defina DATABASE_URL}"
: "${BACKUP_DIR:?Defina BACKUP_DIR para um diretório dedicado}"
: "${BACKUP_ENCRYPTION_PASSWORD:?Defina BACKUP_ENCRYPTION_PASSWORD}"

mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
plain_file="$BACKUP_DIR/angell-$timestamp.dump"
encrypted_file="$plain_file.enc"

pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$plain_file"
openssl enc -aes-256-cbc -pbkdf2 -salt \
  -in "$plain_file" -out "$encrypted_file" \
  -pass env:BACKUP_ENCRYPTION_PASSWORD
rm -f -- "$plain_file"
sha256sum "$encrypted_file" > "$encrypted_file.sha256"

find "$BACKUP_DIR" -type f -name 'angell-*.dump.enc' -mtime "+${BACKUP_RETENTION_DAYS:-30}" -delete
find "$BACKUP_DIR" -type f -name 'angell-*.dump.enc.sha256' -mtime "+${BACKUP_RETENTION_DAYS:-30}" -delete

echo "Backup criado: $encrypted_file"
