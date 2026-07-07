CREATE TABLE IF NOT EXISTS user_square_customer (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  square_customer_id TEXT NOT NULL UNIQUE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_square_customer_square_customer_id
  ON user_square_customer(square_customer_id);

ALTER TABLE user_square_customer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view user square customer links"
  ON user_square_customer FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE UNIQUE INDEX IF NOT EXISTS idx_square_purchase_payment_product
  ON square_purchase (square_payment_id, product_id)
  WHERE square_payment_id IS NOT NULL AND status = 'completed';
