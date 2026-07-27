ALTER TABLE product
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 100;

ALTER TABLE product
    DROP CONSTRAINT IF EXISTS product_stock_quantity_check;

ALTER TABLE product
    ADD CONSTRAINT product_stock_quantity_check
    CHECK (stock_quantity >= 0);

ALTER TABLE purchase_order
    ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS original_price NUMERIC(19, 2);

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS discount_percent INTEGER;

UPDATE order_items
SET original_price = price
WHERE original_price IS NULL;

UPDATE order_items
SET discount_percent = 0
WHERE discount_percent IS NULL;
