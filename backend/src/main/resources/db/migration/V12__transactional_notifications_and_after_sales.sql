CREATE TABLE notification_outbox (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES purchase_order(id) ON DELETE CASCADE,
    order_number VARCHAR(255),
    channel VARCHAR(20) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    recipient VARCHAR(320) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    secure_url TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP,
    sent_at TIMESTAMP,
    last_error VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_notification_outbox_pending
    ON notification_outbox (status, next_attempt_at, created_at);

CREATE TABLE after_sales_request (
    id UUID PRIMARY KEY,
    protocol VARCHAR(40) NOT NULL UNIQUE,
    access_token VARCHAR(100) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
    order_number VARCHAR(255) NOT NULL,
    request_type VARCHAR(30) NOT NULL,
    reason VARCHAR(120) NOT NULL,
    details TEXT,
    status VARCHAR(40) NOT NULL,
    refund_status VARCHAR(40) NOT NULL DEFAULT 'NOT_REQUESTED',
    deadline_at TIMESTAMP NOT NULL,
    returned_to_stock BOOLEAN NOT NULL DEFAULT FALSE,
    admin_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_after_sales_order ON after_sales_request (order_id, created_at DESC);
CREATE INDEX ix_after_sales_status ON after_sales_request (status, deadline_at);

CREATE TABLE after_sales_attachments (
    request_id UUID NOT NULL REFERENCES after_sales_request(id) ON DELETE CASCADE,
    attachment_url TEXT NOT NULL
);
