-- Admin email changes must update auth.users and the email identity.
-- The Auth admin API only stores a pending email_change when secure email
-- change is enabled, so the address shown in the app never updates.

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
      coalesce(identity_data, '{}'::jsonb),
      '{email}',
      to_jsonb(normalized),
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
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_auth_user_email(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_auth_user_email(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_auth_user_email(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_auth_user_email(uuid, text) TO service_role;
