#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

: "${DATABASE_URL:?Defina DATABASE_URL para o banco de restauração}"
: "${BACKUP_ENCRYPTION_PASSWORD:?Defina BACKUP_ENCRYPTION_PASSWORD}"
backup_file="${1:?Uso: restore-postgres.sh caminho/backup.dump.enc}"

sha256sum --check "$backup_file.sha256"
temporary_dump="$(mktemp)"
trap 'rm -f -- "$temporary_dump"' EXIT
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in "$backup_file" -out "$temporary_dump" \
  -pass env:BACKUP_ENCRYPTION_PASSWORD
pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner --no-acl "$temporary_dump"
echo "Restauração concluída e integridade verificada."
