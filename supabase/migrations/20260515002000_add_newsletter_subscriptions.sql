CREATE TABLE IF NOT EXISTS newsletter_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wants_monthly_calendar BOOLEAN NOT NULL DEFAULT false,
  unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscription_email_active
  ON newsletter_subscription (lower(email))
  WHERE unsubscribed_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscription_unsubscribe_token
  ON newsletter_subscription (unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscription_created_at
  ON newsletter_subscription (created_at DESC);

ALTER TABLE newsletter_subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to create newsletter subscriptions"
  ON newsletter_subscription FOR INSERT
  TO public
  WITH CHECK (
    name <> ''
    AND email <> ''
    AND unsubscribed_at IS NULL
  );

CREATE POLICY "Allow admins to view newsletter subscriptions"
  ON newsletter_subscription FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
