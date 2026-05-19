ALTER TABLE square_purchase
  ADD COLUMN IF NOT EXISTS square_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS square_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_square_purchase_square_subscription_id
  ON square_purchase(square_subscription_id)
  WHERE square_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_square_purchase_square_customer_id
  ON square_purchase(square_customer_id)
  WHERE square_customer_id IS NOT NULL;
