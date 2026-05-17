CREATE TABLE IF NOT EXISTS square_purchase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_kind TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  credits NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  square_payment_link_id TEXT,
  square_payment_link_url TEXT,
  square_order_id TEXT,
  square_payment_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_square_purchase_user_id ON square_purchase(user_id);
CREATE INDEX IF NOT EXISTS idx_square_purchase_square_order_id ON square_purchase(square_order_id);
CREATE INDEX IF NOT EXISTS idx_square_purchase_square_payment_id ON square_purchase(square_payment_id);
CREATE INDEX IF NOT EXISTS idx_square_purchase_status ON square_purchase(status);

ALTER TABLE square_purchase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Square purchases"
  ON square_purchase FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all Square purchases"
  ON square_purchase FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

