ALTER TABLE product ADD COLUMN IF NOT EXISTS weight NUMERIC(10, 3);
ALTER TABLE product ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE product ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE product ADD COLUMN IF NOT EXISTS length INTEGER;

ALTER TABLE product ADD CONSTRAINT product_weight_positive CHECK (weight IS NULL OR weight > 0);
ALTER TABLE product ADD CONSTRAINT product_height_positive CHECK (height IS NULL OR height > 0);
ALTER TABLE product ADD CONSTRAINT product_width_positive CHECK (width IS NULL OR width > 0);
ALTER TABLE product ADD CONSTRAINT product_length_positive CHECK (length IS NULL OR length > 0);
