ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS public_tracking_token VARCHAR(100);
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP;
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS inventory_state VARCHAR(30) NOT NULL DEFAULT 'RESERVED';

CREATE UNIQUE INDEX IF NOT EXISTS ux_purchase_order_idempotency_key
    ON purchase_order (idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS ux_purchase_order_tracking_token
    ON purchase_order (public_tracking_token);

ALTER TABLE product ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS sold_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS minimum_stock INTEGER NOT NULL DEFAULT 3;

ALTER TABLE product ADD CONSTRAINT product_reserved_quantity_check CHECK (reserved_quantity >= 0);
ALTER TABLE product ADD CONSTRAINT product_sold_quantity_check CHECK (sold_quantity >= 0);
ALTER TABLE product ADD CONSTRAINT product_minimum_stock_check CHECK (minimum_stock >= 0);
ALTER TABLE product ADD CONSTRAINT product_reserved_not_above_stock_check CHECK (reserved_quantity <= stock_quantity);

CREATE TABLE IF NOT EXISTS inventory_movement (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES product(id),
    order_id UUID REFERENCES purchase_order(id),
    movement_type VARCHAR(30) NOT NULL,
    quantity INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason VARCHAR(500) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_inventory_movement_product_created
    ON inventory_movement (product_id, created_at DESC);
