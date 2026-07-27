UPDATE purchase_order
SET inventory_state = 'RELEASED'
WHERE reservation_expires_at IS NULL
  AND inventory_state = 'RESERVED';
