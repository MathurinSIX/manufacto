-- Replace multi-hour practice opening blocks with 1-hour sessions so max_registrations
-- applies per session (per hour) consistently in admin and booking UIs.

DELETE FROM session s
USING activity a
WHERE s.activity_id = a.id
  AND a.type IN ('autonomie', 'autonomie_encadree', 'accompagnement')
  AND s.start_ts >= (DATE '2026-05-26' + TIME '00:00') AT TIME ZONE 'Europe/Paris'
  AND s.start_ts < (DATE '2026-07-19' + TIME '00:00') AT TIME ZONE 'Europe/Paris'
  AND NOT EXISTS (
    SELECT 1 FROM registration r WHERE r.session_id = s.id
  );

CREATE OR REPLACE FUNCTION insert_practice_hourly_slots(
  p_activity_id UUID,
  p_day DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_max_registrations INTEGER
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  slot_start TIMESTAMPTZ;
  block_end TIMESTAMPTZ;
BEGIN
  block_end := (p_day + p_end_time) AT TIME ZONE 'Europe/Paris';
  slot_start := (p_day + p_start_time) AT TIME ZONE 'Europe/Paris';

  WHILE slot_start + INTERVAL '1 hour' <= block_end LOOP
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT
      p_activity_id,
      slot_start,
      slot_start + INTERVAL '1 hour',
      p_max_registrations
    WHERE NOT EXISTS (
      SELECT 1
      FROM session s
      WHERE s.activity_id = p_activity_id
        AND s.start_ts = slot_start
        AND s.end_ts = slot_start + INTERVAL '1 hour'
    );

    slot_start := slot_start + INTERVAL '1 hour';
  END LOOP;
END;
$$;

DO $$
DECLARE
  menuiserie_aa_id UUID;
  menuiserie_aae_id UUID;
  menuiserie_accompagnement_id UUID;
  couture_aa_id UUID;
  couture_aae_id UUID;
  ceramique_aa_id UUID;
  electronique_aa_id UUID;

  week_offset INTEGER;
  tuesday DATE;
  session_day DATE;
  saturday DATE;
BEGIN
  SELECT id INTO menuiserie_aa_id FROM activity WHERE name = 'Menuiserie en autonomie';
  SELECT id INTO menuiserie_aae_id FROM activity WHERE name = 'Menuiserie en autonomie encadrée';
  SELECT id INTO menuiserie_accompagnement_id FROM activity WHERE name = 'Accompagnement projet menuiserie';
  SELECT id INTO couture_aa_id FROM activity WHERE name = 'Couture en autonomie';
  SELECT id INTO couture_aae_id FROM activity WHERE name = 'Couture en autonomie encadrée';
  SELECT id INTO ceramique_aa_id FROM activity WHERE name = 'Céramique en autonomie';
  SELECT id INTO electronique_aa_id FROM activity WHERE name = 'Électronique en autonomie';

  IF menuiserie_aa_id IS NULL
    OR menuiserie_aae_id IS NULL
    OR menuiserie_accompagnement_id IS NULL
    OR couture_aa_id IS NULL
    OR couture_aae_id IS NULL
    OR ceramique_aa_id IS NULL
    OR electronique_aa_id IS NULL
  THEN
    RAISE EXCEPTION 'One or more practice activities are missing';
  END IF;

  tuesday := DATE '2026-05-26';

  FOR week_offset IN 0..2 LOOP
    session_day := tuesday + (week_offset * 7);

    PERFORM insert_practice_hourly_slots(menuiserie_aa_id, session_day, TIME '13:00', TIME '20:00', 10);
    PERFORM insert_practice_hourly_slots(menuiserie_aae_id, session_day, TIME '18:00', TIME '20:00', 4);
    PERFORM insert_practice_hourly_slots(menuiserie_accompagnement_id, session_day, TIME '17:00', TIME '18:00', 2);
    PERFORM insert_practice_hourly_slots(couture_aa_id, session_day, TIME '13:00', TIME '20:00', 6);
    PERFORM insert_practice_hourly_slots(couture_aae_id, session_day, TIME '18:00', TIME '20:00', 4);
    PERFORM insert_practice_hourly_slots(ceramique_aa_id, session_day, TIME '13:00', TIME '20:00', 6);
    PERFORM insert_practice_hourly_slots(electronique_aa_id, session_day, TIME '13:00', TIME '20:00', 6);

    session_day := tuesday + (week_offset * 7) + 1;
    PERFORM insert_practice_hourly_slots(menuiserie_aa_id, session_day, TIME '09:00', TIME '13:00', 10);
    PERFORM insert_practice_hourly_slots(menuiserie_aa_id, session_day, TIME '17:00', TIME '21:00', 10);
    PERFORM insert_practice_hourly_slots(menuiserie_aae_id, session_day, TIME '18:00', TIME '21:00', 4);
    PERFORM insert_practice_hourly_slots(menuiserie_accompagnement_id, session_day, TIME '17:00', TIME '18:00', 2);
    PERFORM insert_practice_hourly_slots(couture_aa_id, session_day, TIME '17:00', TIME '21:00', 6);
    PERFORM insert_practice_hourly_slots(couture_aae_id, session_day, TIME '09:00', TIME '13:00', 4);
    PERFORM insert_practice_hourly_slots(ceramique_aa_id, session_day, TIME '09:00', TIME '21:00', 6);
    PERFORM insert_practice_hourly_slots(electronique_aa_id, session_day, TIME '17:00', TIME '21:00', 6);

    session_day := tuesday + (week_offset * 7) + 2;
    PERFORM insert_practice_hourly_slots(menuiserie_aa_id, session_day, TIME '13:00', TIME '17:00', 10);
    PERFORM insert_practice_hourly_slots(couture_aa_id, session_day, TIME '13:00', TIME '21:00', 6);
    PERFORM insert_practice_hourly_slots(couture_aae_id, session_day, TIME '19:00', TIME '21:00', 4);
    PERFORM insert_practice_hourly_slots(ceramique_aa_id, session_day, TIME '13:00', TIME '21:00', 6);
    PERFORM insert_practice_hourly_slots(electronique_aa_id, session_day, TIME '13:00', TIME '21:00', 6);

    session_day := tuesday + (week_offset * 7) + 3;
    PERFORM insert_practice_hourly_slots(menuiserie_aa_id, session_day, TIME '09:00', TIME '16:00', 10);
    PERFORM insert_practice_hourly_slots(menuiserie_aae_id, session_day, TIME '09:00', TIME '11:00', 4);
    PERFORM insert_practice_hourly_slots(couture_aa_id, session_day, TIME '09:00', TIME '16:00', 6);
    PERFORM insert_practice_hourly_slots(ceramique_aa_id, session_day, TIME '09:00', TIME '16:00', 6);
    PERFORM insert_practice_hourly_slots(electronique_aa_id, session_day, TIME '09:00', TIME '16:00', 6);

    saturday := tuesday + (week_offset * 7) + 4;
    PERFORM insert_practice_hourly_slots(couture_aa_id, saturday, TIME '09:00', TIME '12:00', 6);
    PERFORM insert_practice_hourly_slots(couture_aa_id, saturday, TIME '13:00', TIME '17:00', 6);
    PERFORM insert_practice_hourly_slots(ceramique_aa_id, saturday, TIME '09:00', TIME '12:00', 6);
    PERFORM insert_practice_hourly_slots(ceramique_aa_id, saturday, TIME '13:00', TIME '17:00', 6);
    PERFORM insert_practice_hourly_slots(electronique_aa_id, saturday, TIME '09:00', TIME '12:00', 6);
    PERFORM insert_practice_hourly_slots(electronique_aa_id, saturday, TIME '13:00', TIME '17:00', 6);
  END LOOP;

  FOREACH session_day IN ARRAY ARRAY[
    DATE '2026-06-06',
    DATE '2026-06-13',
    DATE '2026-07-04',
    DATE '2026-07-18'
  ]::DATE[]
  LOOP
    PERFORM insert_practice_hourly_slots(menuiserie_aa_id, session_day, TIME '09:00', TIME '12:00', 10);
    PERFORM insert_practice_hourly_slots(menuiserie_aa_id, session_day, TIME '13:00', TIME '17:00', 10);
  END LOOP;

  FOREACH session_day IN ARRAY ARRAY[
    DATE '2026-06-20',
    DATE '2026-07-11'
  ]::DATE[]
  LOOP
    PERFORM insert_practice_hourly_slots(menuiserie_aa_id, session_day, TIME '13:00', TIME '17:00', 10);
  END LOOP;
END $$;

DROP FUNCTION insert_practice_hourly_slots(
  UUID,
  DATE,
  TIME,
  TIME,
  INTEGER
);
