-- One extra login on an account (duo). The owner's user id keeps credits,
-- reservations, and documents. The partner's session resolves to that id.

CREATE TABLE IF NOT EXISTS account_partner (
  owner_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_email TEXT NOT NULL,
  partner_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT account_partner_distinct_users CHECK (
    partner_user_id IS NULL OR partner_user_id <> owner_user_id
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS account_partner_email_key
  ON account_partner (lower(partner_email));

ALTER TABLE account_partner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their account link" ON account_partner;
CREATE POLICY "Members can view their account link"
  ON account_partner FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR partner_user_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE OR REPLACE FUNCTION public.shared_account_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT owner_user_id
      FROM account_partner
      WHERE partner_user_id = auth.uid()
        AND status = 'active'
      LIMIT 1
    ),
    auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.shared_account_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.shared_account_user_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.lookup_auth_user_by_email(target_email text)
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  is_admin boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT
    u.id,
    u.email::text,
    u.raw_user_meta_data->>'first_name',
    u.raw_user_meta_data->>'last_name',
    COALESCE(u.raw_app_meta_data->>'role', '') = 'admin'
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(target_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_auth_user_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_auth_user_by_email(text) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_account_partner_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.partner_email := lower(btrim(NEW.partner_email));

  IF NEW.partner_user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM account_partner existing
    WHERE existing.owner_user_id = NEW.partner_user_id
      AND existing.owner_user_id <> NEW.owner_user_id
  ) THEN
    RAISE EXCEPTION 'this account already has a second person';
  END IF;

  IF NEW.partner_user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM account_partner existing
    WHERE existing.partner_user_id = NEW.partner_user_id
      AND existing.owner_user_id <> NEW.owner_user_id
  ) THEN
    RAISE EXCEPTION 'this person is already linked to another account';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM account_partner existing
    WHERE existing.partner_user_id = NEW.owner_user_id
      AND existing.status = 'active'
      AND existing.owner_user_id <> NEW.owner_user_id
  ) THEN
    RAISE EXCEPTION 'linked members cannot host a second login';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS account_partner_rules ON account_partner;
CREATE TRIGGER account_partner_rules
  BEFORE INSERT OR UPDATE ON account_partner
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_account_partner_rules();

-- Shared access: a linked login reads and writes the owner's rows.

DROP POLICY IF EXISTS "Users can create their own registrations" ON registration;
CREATE POLICY "Users can create their own registrations"
  ON registration FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can view their own credits" ON credit;
CREATE POLICY "Users can view their own credits"
  ON credit FOR SELECT
  TO authenticated
  USING (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can create status for their own registrations" ON registration_status;
CREATE POLICY "Users can create status for their own registrations"
  ON registration_status FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM registration r
      INNER JOIN session s ON s.id = r.session_id
      WHERE r.id = registration_status.registration_id
        AND r.user_id = public.shared_account_user_id()
        AND COALESCE(r.reserved_start_ts, s.start_ts) > NOW()
    )
  );

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profile;
CREATE POLICY "Users can view their own profile"
  ON user_profile FOR SELECT
  TO authenticated
  USING (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profile;
CREATE POLICY "Users can insert their own profile"
  ON user_profile FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profile;
CREATE POLICY "Users can update their own profile"
  ON user_profile FOR UPDATE
  TO authenticated
  USING (user_id = public.shared_account_user_id())
  WITH CHECK (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can view their own legal acceptances" ON user_legal_acceptance;
CREATE POLICY "Users can view their own legal acceptances"
  ON user_legal_acceptance FOR SELECT
  TO authenticated
  USING (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can create their own online legal acceptances" ON user_legal_acceptance;
CREATE POLICY "Users can create their own online legal acceptances"
  ON user_legal_acceptance FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = public.shared_account_user_id()
    AND channel = 'online'
  );

DROP POLICY IF EXISTS "Users can view their own habilitations" ON user_habilitation;
CREATE POLICY "Users can view their own habilitations"
  ON user_habilitation FOR SELECT
  TO authenticated
  USING (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can view their own Square purchases" ON square_purchase;
CREATE POLICY "Users can view their own Square purchases"
  ON square_purchase FOR SELECT
  TO authenticated
  USING (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can cancel their own subscription purchases" ON square_purchase;
CREATE POLICY "Users can cancel their own subscription purchases"
  ON square_purchase FOR UPDATE
  TO authenticated
  USING (
    user_id = public.shared_account_user_id()
    AND product_kind = 'subscription'
    AND status = 'completed'
  )
  WITH CHECK (
    user_id = public.shared_account_user_id()
    AND product_kind = 'subscription'
    AND status = 'cancelled'
  );

DROP POLICY IF EXISTS "Users can view their own activity interests" ON activity_interest;
CREATE POLICY "Users can view their own activity interests"
  ON activity_interest FOR SELECT
  TO authenticated
  USING (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can register their own activity interest" ON activity_interest;
CREATE POLICY "Users can register their own activity interest"
  ON activity_interest FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = public.shared_account_user_id()
    AND EXISTS (
      SELECT 1
      FROM activity
      WHERE activity.id = activity_interest.activity_id
        AND activity.type = 'cours'
        AND activity.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can remove their own activity interest" ON activity_interest;
CREATE POLICY "Users can remove their own activity interest"
  ON activity_interest FOR DELETE
  TO authenticated
  USING (user_id = public.shared_account_user_id());

DROP POLICY IF EXISTS "Users can upload their own signatures" ON storage.objects;
CREATE POLICY "Users can upload their own signatures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'legal-signatures'
    AND (storage.foldername(name))[1] = public.shared_account_user_id()::text
  );

DROP POLICY IF EXISTS "Users can read their own signatures" ON storage.objects;
CREATE POLICY "Users can read their own signatures"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'legal-signatures'
    AND (storage.foldername(name))[1] = public.shared_account_user_id()::text
  );
