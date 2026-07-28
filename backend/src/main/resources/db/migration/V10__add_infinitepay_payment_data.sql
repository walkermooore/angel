ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(30);
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS payment_checkout_url TEXT;
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS payment_invoice_slug VARCHAR(255);
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS payment_transaction_nsu VARCHAR(255);
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS payment_capture_method VARCHAR(30);
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS payment_installments INTEGER;
ALTER TABLE purchase_order ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS ux_purchase_order_payment_transaction_nsu
    ON purchase_order(payment_transaction_nsu);
