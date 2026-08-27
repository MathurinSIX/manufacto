-- Historical duplicate completed rows for the same Square payment block a
-- stronger uniqueness constraint (observed before idx_square_purchase_payment_product).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY square_payment_id, product_id
      ORDER BY fulfilled_at ASC NULLS LAST, created_at ASC
    ) AS rn
  FROM square_purchase
  WHERE square_payment_id IS NOT NULL
    AND status IN ('completed', 'processing')
)
UPDATE square_purchase
SET status = 'failed'
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Prevent concurrent POS import + online fulfill from both claiming the same
-- Square payment (previous unique index only covered status = 'completed').
DROP INDEX IF EXISTS idx_square_purchase_payment_product;

CREATE UNIQUE INDEX IF NOT EXISTS idx_square_purchase_payment_product
  ON square_purchase (square_payment_id, product_id)
  WHERE square_payment_id IS NOT NULL
    AND status IN ('completed', 'processing');

-- Idempotent credit grants keyed by Square payment id embedded in payment_type
-- (format: square:<kind>:<paymentId>).
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_square_payment_idempotency
  ON credit (payment_type)
  WHERE payment_type LIKE 'square:%:%';
