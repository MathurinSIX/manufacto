-- Admin / product feedback: session groups, multi-discipline, household members,
-- and fix legal-document admin RLS (jwt.role → app_metadata.role).

-- 1) Multi-date course session grouping
ALTER TABLE session
  ADD COLUMN IF NOT EXISTS session_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_session_session_group_id
  ON session(session_group_id)
  WHERE session_group_id IS NOT NULL;

-- 2) Multi-universe (disciplines) per activity — keep legacy `discipline` as primary
ALTER TABLE activity
  ADD COLUMN IF NOT EXISTS disciplines TEXT[];

UPDATE activity
SET disciplines = ARRAY[discipline]
WHERE discipline IS NOT NULL
  AND (disciplines IS NULL OR cardinality(disciplines) = 0);

-- 3) Family / duo household members on profile
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS member_names TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS child_names TEXT[] NOT NULL DEFAULT '{}';

-- 4) Fix legal RLS: top-level JWT `role` is "authenticated", not "admin"
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profile;
CREATE POLICY "Admins can manage all profiles"
  ON user_profile FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can manage legal documents" ON legal_document;
CREATE POLICY "Admins can manage legal documents"
  ON legal_document FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can manage all legal acceptances" ON user_legal_acceptance;
CREATE POLICY "Admins can manage all legal acceptances"
  ON user_legal_acceptance FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can manage habilitations" ON user_habilitation;
CREATE POLICY "Admins can manage habilitations"
  ON user_habilitation FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
