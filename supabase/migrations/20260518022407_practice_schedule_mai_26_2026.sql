-- Practice opening blocks from Tuesday 26 May 2026 for 3 weeks.
-- Times are Europe/Paris wall clock; max_registrations is per hour.
--
-- MENUISERIE
--   Autonomie complète: 10 places/h, min 2h booking (app-enforced)
--   Autonomie encadrée: 4 places/h
--   Aide à la conception: 2 places/h, 1h slots
-- COUTURE / CÉRAMIQUE / ÉLECTRONIQUE: see comments per activity below.

-- seed.sql runs after migrations; ensure practice activities exist for fresh db reset.
INSERT INTO activity (name, type, nb_credits, description)
SELECT 'Menuiserie en autonomie', 'autonomie', 5, 'Accédez librement à l''atelier de menuiserie pour travailler sur vos projets personnels.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Menuiserie en autonomie');

INSERT INTO activity (name, type, nb_credits, description)
SELECT 'Menuiserie en autonomie encadrée', 'autonomie_encadree', 8, 'Sessions de menuiserie en autonomie avec encadrement renforcé.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Menuiserie en autonomie encadrée');

INSERT INTO activity (name, type, nb_credits, description)
SELECT 'Accompagnement projet menuiserie', 'accompagnement', 4, 'Séances individuelles d''accompagnement pour vos projets de menuiserie.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Accompagnement projet menuiserie');

INSERT INTO activity (name, type, nb_credits, description)
SELECT 'Couture en autonomie', 'autonomie', 5, 'Accédez librement à l''atelier de couture pour travailler sur vos projets textiles.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Couture en autonomie');

INSERT INTO activity (name, type, nb_credits, description)
SELECT 'Couture en autonomie encadrée', 'autonomie_encadree', 8, 'Sessions de couture en autonomie avec encadrement renforcé.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Couture en autonomie encadrée');

INSERT INTO activity (name, type, nb_credits, description)
SELECT 'Céramique en autonomie', 'autonomie', 5, 'Accédez librement à l''atelier de céramique pour modeler, tourner et décorer vos créations.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Céramique en autonomie');

INSERT INTO activity (name, type, nb_credits, description)
SELECT 'Électronique en autonomie', 'autonomie', 5, 'Accédez à l''espace électronique pour réparer, modifier ou créer vos projets électroniques.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Électronique en autonomie');

-- Remove unbooked practice sessions in the revision window (e.g. legacy 2h seed slots).
DELETE FROM session s
USING activity a
WHERE s.activity_id = a.id
  AND a.type IN ('autonomie', 'autonomie_encadree', 'accompagnement')
  AND s.start_ts >= (DATE '2026-05-26' + TIME '00:00') AT TIME ZONE 'Europe/Paris'
  AND s.start_ts < (DATE '2026-07-19' + TIME '00:00') AT TIME ZONE 'Europe/Paris'
  AND NOT EXISTS (
    SELECT 1 FROM registration r WHERE r.session_id = s.id
  );

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

    -- Mardi
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris', 10
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aae_id, (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris', 4
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aae_id
        AND s.start_ts = (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_accompagnement_id, (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris', 2
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_accompagnement_id
        AND s.start_ts = (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aae_id, (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris', 4
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aae_id
        AND s.start_ts = (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT ceramique_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = ceramique_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT electronique_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = electronique_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '20:00') AT TIME ZONE 'Europe/Paris'
    );

    -- Mercredi
    session_day := tuesday + (week_offset * 7) + 1;

    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aa_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', 10
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aa_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aa_id, (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 10
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aa_id
        AND s.start_ts = (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aae_id, (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 4
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aae_id
        AND s.start_ts = (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_accompagnement_id, (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris', 2
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_accompagnement_id
        AND s.start_ts = (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '18:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aa_id, (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aa_id
        AND s.start_ts = (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aae_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', 4
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aae_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT ceramique_aa_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = ceramique_aa_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT electronique_aa_id, (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = electronique_aa_id
        AND s.start_ts = (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );

    -- Jeudi
    session_day := tuesday + (week_offset * 7) + 2;

    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris', 10
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aae_id, (session_day + TIME '19:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 4
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aae_id
        AND s.start_ts = (session_day + TIME '19:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT ceramique_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = ceramique_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT electronique_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = electronique_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '21:00') AT TIME ZONE 'Europe/Paris'
    );

    -- Vendredi
    session_day := tuesday + (week_offset * 7) + 3;

    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aa_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '16:00') AT TIME ZONE 'Europe/Paris', 10
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aa_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '16:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aae_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '11:00') AT TIME ZONE 'Europe/Paris', 4
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aae_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '11:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aa_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '16:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aa_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '16:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT ceramique_aa_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '16:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = ceramique_aa_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '16:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT electronique_aa_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '16:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = electronique_aa_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '16:00') AT TIME ZONE 'Europe/Paris'
    );

    -- Samedi (couture, céramique, électronique — chaque samedi des 3 semaines)
    saturday := tuesday + (week_offset * 7) + 4;

    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aa_id, (saturday + TIME '09:00') AT TIME ZONE 'Europe/Paris', (saturday + TIME '12:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aa_id
        AND s.start_ts = (saturday + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (saturday + TIME '12:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT couture_aa_id, (saturday + TIME '13:00') AT TIME ZONE 'Europe/Paris', (saturday + TIME '17:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = couture_aa_id
        AND s.start_ts = (saturday + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (saturday + TIME '17:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT ceramique_aa_id, (saturday + TIME '09:00') AT TIME ZONE 'Europe/Paris', (saturday + TIME '12:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = ceramique_aa_id
        AND s.start_ts = (saturday + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (saturday + TIME '12:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT ceramique_aa_id, (saturday + TIME '13:00') AT TIME ZONE 'Europe/Paris', (saturday + TIME '17:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = ceramique_aa_id
        AND s.start_ts = (saturday + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (saturday + TIME '17:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT electronique_aa_id, (saturday + TIME '09:00') AT TIME ZONE 'Europe/Paris', (saturday + TIME '12:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = electronique_aa_id
        AND s.start_ts = (saturday + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (saturday + TIME '12:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT electronique_aa_id, (saturday + TIME '13:00') AT TIME ZONE 'Europe/Paris', (saturday + TIME '17:00') AT TIME ZONE 'Europe/Paris', 6
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = electronique_aa_id
        AND s.start_ts = (saturday + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (saturday + TIME '17:00') AT TIME ZONE 'Europe/Paris'
    );
  END LOOP;

  -- Menuiserie autonomie complète — samedis exceptionnels
  FOREACH session_day IN ARRAY ARRAY[
    DATE '2026-06-06',
    DATE '2026-06-13',
    DATE '2026-07-04',
    DATE '2026-07-18'
  ]::DATE[]
  LOOP
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aa_id, (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '12:00') AT TIME ZONE 'Europe/Paris', 10
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aa_id
        AND s.start_ts = (session_day + TIME '09:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '12:00') AT TIME ZONE 'Europe/Paris'
    );
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris', 10
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris'
    );
  END LOOP;

  FOREACH session_day IN ARRAY ARRAY[
    DATE '2026-06-20',
    DATE '2026-07-11'
  ]::DATE[]
  LOOP
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
    SELECT menuiserie_aa_id, (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris', (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris', 10
    WHERE NOT EXISTS (
      SELECT 1 FROM session s
      WHERE s.activity_id = menuiserie_aa_id
        AND s.start_ts = (session_day + TIME '13:00') AT TIME ZONE 'Europe/Paris'
        AND s.end_ts = (session_day + TIME '17:00') AT TIME ZONE 'Europe/Paris'
    );
  END LOOP;
END $$;
