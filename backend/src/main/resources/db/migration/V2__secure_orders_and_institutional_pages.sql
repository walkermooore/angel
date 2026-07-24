CREATE UNIQUE INDEX IF NOT EXISTS uk_purchase_order_number
    ON purchase_order(number);

CREATE TABLE IF NOT EXISTS institutional_settings (
    id BIGINT PRIMARY KEY,
    terms_content TEXT NOT NULL,
    exchanges_content TEXT NOT NULL,
    privacy_content TEXT NOT NULL,
    updated_at TIMESTAMP
);
