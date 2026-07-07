CREATE TABLE IF NOT EXISTS activity_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activity(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_interest_activity_id
  ON activity_interest(activity_id);

CREATE INDEX IF NOT EXISTS idx_activity_interest_user_id
  ON activity_interest(user_id);

ALTER TABLE activity_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity interests"
  ON activity_interest FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register their own activity interest"
  ON activity_interest FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM activity
      WHERE activity.id = activity_interest.activity_id
        AND activity.type = 'cours'
        AND activity.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can remove their own activity interest"
  ON activity_interest FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity interests"
  ON activity_interest FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');
