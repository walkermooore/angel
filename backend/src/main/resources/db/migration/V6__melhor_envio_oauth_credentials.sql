CREATE TABLE IF NOT EXISTS melhor_envio_credentials (
    id BIGINT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(30) NOT NULL,
    access_expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP NOT NULL,
    environment VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
