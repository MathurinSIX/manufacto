-- Exclusive workshop machines, explicit course duration, custom disciplines,
-- and an admin read policy that matches app_metadata.role.

ALTER TABLE public.activity
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

ALTER TABLE public.activity
  DROP CONSTRAINT IF EXISTS activity_duration_minutes_positive;

ALTER TABLE public.activity
  ADD CONSTRAINT activity_duration_minutes_positive
  CHECK (duration_minutes IS NULL OR duration_minutes > 0);

CREATE TABLE IF NOT EXISTS public.course_discipline (
  slug text PRIMARY KEY,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_discipline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read course disciplines" ON public.course_discipline;
CREATE POLICY "Anyone can read course disciplines"
  ON public.course_discipline FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage course disciplines" ON public.course_discipline;
CREATE POLICY "Admins manage course disciplines"
  ON public.course_discipline FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

INSERT INTO public.course_discipline (slug, label, sort_order) VALUES
  ('menuiserie', 'Menuiserie', 1),
  ('couture', 'Couture', 2),
  ('electronique', 'Électronique', 3),
  ('ceramique', 'Céramique', 4),
  ('autre', 'Autre', 5)
ON CONFLICT (slug) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

ALTER TABLE public.square_purchase
  ADD COLUMN IF NOT EXISTS reserved_machines text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.registration
  ADD COLUMN IF NOT EXISTS reserved_machines text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.registration
  DROP CONSTRAINT IF EXISTS registration_reserved_machines_known;

ALTER TABLE public.registration
  ADD CONSTRAINT registration_reserved_machines_known
  CHECK (
    reserved_machines <@ ARRAY[
      'tour-potier',
      'tour-bois',
      'scie-format',
      'degau-rabot'
    ]::text[]
  );

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.registration_is_active(reg_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT status IS DISTINCT FROM 'CANCELLED'
      FROM public.registration_status
      WHERE registration_id = reg_id
      ORDER BY created_at DESC
      LIMIT 1
    ),
    true
  );
$$;

REVOKE ALL ON FUNCTION private.registration_is_active(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.practice_discipline(
  discipline text,
  activity_name text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN discipline IN ('menuiserie', 'ceramique') THEN discipline
    WHEN activity_name ILIKE '%céramique%' OR activity_name ILIKE '%ceramique%' THEN 'ceramique'
    WHEN activity_name ILIKE '%menuiserie%' THEN 'menuiserie'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION private.workshop_machines_taken(
  p_start timestamptz,
  p_end timestamptz,
  p_discipline text
)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT machine), ARRAY[]::text[])
  FROM (
    SELECT unnest(r.reserved_machines) AS machine
    FROM public.registration r
    JOIN public.session s ON s.id = r.session_id
    JOIN public.activity a ON a.id = s.activity_id
    WHERE p_start IS NOT NULL
      AND p_end IS NOT NULL
      AND p_end > p_start
      AND r.reserved_start_ts IS NOT NULL
      AND r.reserved_end_ts IS NOT NULL
      AND r.reserved_start_ts < p_end
      AND r.reserved_end_ts > p_start
      AND cardinality(r.reserved_machines) > 0
      AND private.registration_is_active(r.id)
      AND a.type IN ('autonomie', 'autonomie_encadree')
      AND private.practice_discipline(a.discipline, a.name) = p_discipline
  ) taken;
$$;

REVOKE ALL ON FUNCTION private.workshop_machines_taken(timestamptz, timestamptz, text) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.workshop_machines_taken(timestamptz, timestamptz, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.workshop_machines_taken(
  p_start timestamptz,
  p_end timestamptz,
  p_discipline text
)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.workshop_machines_taken(p_start, p_end, p_discipline);
$$;

REVOKE ALL ON FUNCTION public.workshop_machines_taken(timestamptz, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.workshop_machines_taken(timestamptz, timestamptz, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.enforce_workshop_machine_exclusivity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_discipline text;
  activity_type text;
  conflicting text;
BEGIN
  IF NEW.reserved_machines IS NULL OR cardinality(NEW.reserved_machines) = 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.reserved_start_ts IS NULL OR NEW.reserved_end_ts IS NULL THEN
    RAISE EXCEPTION 'Une machine se réserve sur un créneau horaire';
  END IF;

  SELECT a.type, private.practice_discipline(a.discipline, a.name)
  INTO activity_type, activity_discipline
  FROM public.session s
  JOIN public.activity a ON a.id = s.activity_id
  WHERE s.id = NEW.session_id;

  IF activity_type NOT IN ('autonomie', 'autonomie_encadree') THEN
    RAISE EXCEPTION 'Ces machines se réservent en autonomie ou en autonomie encadrée';
  END IF;

  IF activity_discipline = 'ceramique'
     AND NOT (NEW.reserved_machines <@ ARRAY['tour-potier']::text[]) THEN
    RAISE EXCEPTION 'Cette machine n''est pas disponible en céramique';
  END IF;

  IF activity_discipline = 'menuiserie'
     AND NOT (
       NEW.reserved_machines <@ ARRAY['tour-bois', 'scie-format', 'degau-rabot']::text[]
     ) THEN
    RAISE EXCEPTION 'Cette machine n''est pas disponible en menuiserie';
  END IF;

  IF activity_discipline IS NULL THEN
    RAISE EXCEPTION 'Ces machines ne sont pas proposées sur cet atelier';
  END IF;

  SELECT machine INTO conflicting
  FROM (
    SELECT unnest(r.reserved_machines) AS machine
    FROM public.registration r
    JOIN public.session s ON s.id = r.session_id
    JOIN public.activity a ON a.id = s.activity_id
    WHERE r.id IS DISTINCT FROM NEW.id
      AND r.reserved_start_ts < NEW.reserved_end_ts
      AND r.reserved_end_ts > NEW.reserved_start_ts
      AND r.reserved_machines && NEW.reserved_machines
      AND private.registration_is_active(r.id)
      AND a.type IN ('autonomie', 'autonomie_encadree')
      AND private.practice_discipline(a.discipline, a.name) = activity_discipline
  ) taken
  LIMIT 1;

  IF conflicting IS NOT NULL THEN
    RAISE EXCEPTION 'Cette machine est déjà réservée sur ce créneau';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS registration_workshop_machines ON public.registration;
CREATE TRIGGER registration_workshop_machines
  BEFORE INSERT OR UPDATE OF reserved_machines, reserved_start_ts, reserved_end_ts, session_id
  ON public.registration
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_workshop_machine_exclusivity();

DROP POLICY IF EXISTS "Admins can view all activity interests" ON public.activity_interest;
CREATE POLICY "Admins can view all activity interests"
  ON public.activity_interest FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
