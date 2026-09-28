-- Kept in sync with the live function. Admin email changes now go through
-- the Auth admin API; this function remains for direct database use.

CREATE OR REPLACE FUNCTION public.admin_set_auth_user_email(
  target_user_id uuid,
  new_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  normalized text := lower(btrim(new_email));
BEGIN
  IF normalized IS NULL
    OR normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  THEN
    RAISE EXCEPTION 'invalid email';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email::text) = normalized
      AND id <> target_user_id
  ) OR EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE provider = 'email'
      AND lower(email) = normalized
      AND user_id <> target_user_id
  ) THEN
    RAISE EXCEPTION 'email already registered';
  END IF;

  UPDATE auth.users
  SET
    email = normalized,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    email_change_sent_at = NULL,
    email_change_confirm_status = 0,
    updated_at = now()
  WHERE id = target_user_id;

  UPDATE auth.identities
  SET
    identity_data = jsonb_set(
      jsonb_set(
        coalesce(identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(normalized),
        true
      ),
      '{email_verified}',
      'true'::jsonb,
      true
    ),
    updated_at = now()
  WHERE user_id = target_user_id
    AND provider = 'email';

  UPDATE public.account_partner
  SET
    partner_email = normalized,
    updated_at = now()
  WHERE partner_user_id = target_user_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'email already registered';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_auth_user_email(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_auth_user_email(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_auth_user_email(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_auth_user_email(uuid, text) TO service_role;
