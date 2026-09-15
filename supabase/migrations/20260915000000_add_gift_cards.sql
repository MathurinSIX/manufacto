CREATE TABLE IF NOT EXISTS gift_card (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('credits', 'course')),
  credits NUMERIC,
  initial_credits NUMERIC,
  amount_cents INTEGER NOT NULL,
  product_id TEXT,
  activity_id UUID REFERENCES activity(id) ON DELETE SET NULL,
  session_id UUID REFERENCES session(id) ON DELETE SET NULL,
  purchaser_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'depleted', 'redeemed', 'expired', 'cancelled')),
  square_order_id TEXT,
  square_payment_id TEXT UNIQUE,
  square_payment_link_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_code ON gift_card(code);
CREATE INDEX IF NOT EXISTS idx_gift_card_square_order_id ON gift_card(square_order_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_status ON gift_card(status);
CREATE INDEX IF NOT EXISTS idx_gift_card_recipient_email ON gift_card(recipient_email);

CREATE TABLE IF NOT EXISTS gift_card_redemption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_card(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registration(id) ON DELETE SET NULL,
  credits_used NUMERIC NOT NULL DEFAULT 0,
  amount_cents_used INTEGER NOT NULL DEFAULT 0,
  redeemed_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_redemption_gift_card_id
  ON gift_card_redemption(gift_card_id);

ALTER TABLE gift_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_redemption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all gift cards"
  ON gift_card FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can view all gift card redemptions"
  ON gift_card_redemption FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
