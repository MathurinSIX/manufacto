CREATE TABLE IF NOT EXISTS public_session_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_session_subscription_session_id
  ON public_session_subscription(session_id);

CREATE INDEX IF NOT EXISTS idx_public_session_subscription_created_at
  ON public_session_subscription(created_at DESC);

ALTER TABLE public_session_subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to create session subscriptions"
  ON public_session_subscription FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM session
      WHERE session.id = public_session_subscription.session_id
      AND session.start_ts > NOW()
    )
  );

CREATE POLICY "Allow admins to view session subscriptions"
  ON public_session_subscription FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
