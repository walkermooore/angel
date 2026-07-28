ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(1000);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS pending_two_factor_secret VARCHAR(1000);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY,
    admin_user_id UUID NOT NULL,
    token_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(255),
    user_agent VARCHAR(500),
    CONSTRAINT fk_admin_session_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS ix_admin_sessions_user ON admin_sessions(admin_user_id);
