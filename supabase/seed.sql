-- Seed file to populate activities and sessions for the next 4 weeks
-- This file creates all activities and their sessions according to the schedule
--
-- Opening hours:
--   Monday:   Fermé (Closed)
--   Tuesday:  13h-20h
--   Wednesday: 9h-21h
--   Thursday:  13h-21h
--   Friday:    13h-20h
--   Saturday:  10h-17h
--   Sunday:    Fermé (Closed)
--
-- Activity sessions per week:
--   MENUIS / AA (Menuiserie Autonomie): 14 x 2h = 28h
--   MENUIS / AAE (Menuiserie Autonomie Encadrée): 5 x 2h = 10h
--   MENUIS / SAP (Séances d'Accompagnement au Projet): 3 x 1h = 3h
--   COUT / AA (Couture Autonomie): 16 x 2h = 32h
--   COUT / AAE (Couture Autonomie Encadrée): 4 x 2h = 8h
--   CER / AA (Céramique Autonomie): 16 x 2h = 32h
--   ATELIER: 4 x 3h = 12h
--   REPAIR CAFE / ELEC (Repair Café / Electronique): 3 x 2h = 6h
--
-- Note: Timestamps are stored as TIMESTAMPTZ (timezone-aware) in UTC.
-- The application will convert them to Europe/Paris timezone for display.
-- All times in this file are in local time (Europe/Paris) and will be converted
-- to UTC by PostgreSQL based on the database server's timezone setting.

-- First, let's create all the activities
-- Using INSERT with ON CONFLICT to avoid duplicates if activities already exist
-- Menuiserie activities
INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Menuiserie en autonomie', 'autonomie', 5, 'Accédez librement à l''atelier de menuiserie pour travailler sur vos projets personnels. Utilisez les machines et outils disponibles (scies, raboteuses, ponceuses) avec l''assistance de l''équipe si nécessaire. Idéal pour réaliser vos meubles, objets en bois ou projets de rénovation.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Menuiserie en autonomie');

INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Menuiserie en autonomie encadrée', 'autonomie_encadree', 8, 'Sessions de menuiserie en autonomie avec encadrement renforcé. Parfait pour les débutants qui souhaitent apprendre les techniques de base ou pour les projets nécessitant un suivi plus rapproché. Un encadrant est disponible pour vous guider dans l''utilisation des machines et vous conseiller sur vos réalisations.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Menuiserie en autonomie encadrée');

INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Accompagnement projet menuiserie', 'accompagnement', NULL, 'Séances individuelles d''accompagnement pour vos projets de menuiserie. Bénéficiez d''un suivi personnalisé pour la conception, la planification et la réalisation de vos projets. Idéal pour les projets complexes nécessitant des conseils techniques approfondis ou une aide à la résolution de problèmes spécifiques.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Accompagnement projet menuiserie');

-- Couture activities
INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Couture en autonomie', 'autonomie', 5, 'Accédez librement à l''atelier de couture pour travailler sur vos projets textiles. Utilisez les machines à coudre, surjeteuses et autres équipements disponibles. Réalisez vos vêtements, accessoires, travaux de retouche ou projets créatifs avec l''aide de l''équipe si besoin.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Couture en autonomie');

INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Couture en autonomie encadrée', 'autonomie_encadree', 8, 'Sessions de couture en autonomie avec encadrement renforcé. Parfait pour apprendre les bases de la couture, maîtriser l''utilisation des machines ou recevoir des conseils sur vos projets. Un encadrant est présent pour vous accompagner dans vos réalisations et répondre à vos questions techniques.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Couture en autonomie encadrée');

-- Céramique activities
INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Céramique en autonomie', 'autonomie', 5, 'Accédez librement à l''atelier de céramique pour modeler, tourner et décorer vos créations en terre. Utilisez les tours de potier, fours et outils de modelage disponibles. Réalisez vos pièces en céramique, poterie ou sculpture avec l''assistance de l''équipe si nécessaire.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Céramique en autonomie');

INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Cuisson céramique', 'cuisson', NULL, 'Service de cuisson pour vos pièces céramiques. Faites cuire vos créations en terre dans nos fours, même si elles n''ont pas été réalisées à l''atelier. Les pièces doivent être sèches et prêtes pour la cuisson. Contactez-nous pour connaître les modalités et tarifs.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Cuisson céramique');

-- Electronique activities
INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Électronique en autonomie', 'autonomie', 5, 'Accédez à l''espace électronique pour réparer, modifier ou créer vos projets électroniques. Utilisez les outils de soudure, composants et équipements de test disponibles. Idéal pour réparer vos appareils, créer des circuits ou apprendre l''électronique de manière autonome.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Électronique en autonomie');

INSERT INTO activity (name, type, nb_credits, description) 
SELECT 'Repair Café', 'atelier', NULL, 'Le Repair Café est un atelier collaboratif où vous pouvez réparer vos objets du quotidien avec l''aide de bénévoles expérimentés. Apportez vos appareils électroniques, électroménagers ou autres objets à réparer. Venez apprendre à réparer plutôt que jeter, dans une ambiance conviviale et solidaire.'
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Repair Café');

-- Ateliers activities - Mercredi (Week 1-4)
INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Travail du bois : Découpes et assemblages', 'atelier', 12, 'Apprenez les techniques de base de la menuiserie : découpes précises et assemblages traditionnels. Découvrez comment utiliser les outils manuels et électroportatifs pour réaliser vos premiers projets en bois.', 72
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Travail du bois : Découpes et assemblages');

INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Initiation à la défonceuse', 'atelier', 12, 'Maîtrisez l''utilisation de la défonceuse, un outil essentiel en menuiserie. Apprenez les techniques de fraisage, de rainurage et de profilage pour donner forme à vos créations en bois.', 72
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Initiation à la défonceuse');

INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Initiation tapisserie de mobilier', 'atelier', 12, 'Redonnez vie à vos meubles ! Apprenez les techniques de tapisserie traditionnelle : rembourrage, pose de tissus, techniques de finition. Transformez un meuble ancien en pièce unique.', 72
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Initiation tapisserie de mobilier');

INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Formation au tour à bois', 'atelier', 15, 'Découvrez l''art du tournage sur bois. Apprenez à utiliser le tour à bois pour créer des objets cylindriques : bols, pieds de table, objets décoratifs. Technique précise et créative.', 90
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Formation au tour à bois');

-- Ateliers activities - Jeudi (Week 1-4)
INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Initiation couture / Débutant', 'atelier', 10, 'Premiers pas en couture ! Apprenez les bases : enfiler une machine, faire des points droits, des ourlets. Réalisez votre premier projet simple et repartez avec les fondamentaux.', 50
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Initiation couture / Débutant');

INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Créer ta planche à découper', 'atelier', 12, 'Fabriquez votre propre planche à découper en bois massif. Apprenez les techniques de finition alimentaire, de ponçage et d''entretien pour un objet durable et esthétique.', 72
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Créer ta planche à découper');

INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Initiation couture/Intermédiaire', 'atelier', 10, 'Perfectionnez vos compétences en couture. Apprenez des techniques plus avancées : fermetures éclair, poches, manches. Réalisez un projet plus complexe avec l''accompagnement d''un encadrant.', 50
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Initiation couture/Intermédiaire');

INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Initiation à assemblages traditionnels', 'atelier', 12, 'Découvrez les techniques d''assemblage traditionnel en menuiserie : tenons-mortaises, queues d''aronde, mi-bois. Apprenez à créer des assemblages solides et esthétiques sans vis ni clous.', 72
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Initiation à assemblages traditionnels');

-- Ateliers activities - Samedi (Week 4)
INSERT INTO activity (name, type, nb_credits, description, price) 
SELECT 'Initiation au patronage', 'atelier', 15, 'Apprenez à créer vos propres patrons de couture. Découvrez comment prendre les mesures, tracer un patron de base et l''adapter à vos besoins. Base essentielle pour créer vos vêtements sur mesure.', 90
WHERE NOT EXISTS (SELECT 1 FROM activity WHERE name = 'Initiation au patronage');

-- Function to generate sessions for the next 4 weeks
-- This function calculates dates starting from the next Monday
DO $$
DECLARE
  -- Get next Monday (or today if it's Monday)
  start_date DATE;
  session_date DATE;
  week_offset INTEGER;
  day_of_week INTEGER;
  menuiserie_autonomie_id UUID;
  menuiserie_encadree_id UUID;
  menuiserie_accompagnement_id UUID;
  couture_autonomie_id UUID;
  couture_encadree_id UUID;
  ceramique_autonomie_id UUID;
  ceramique_cuisson_id UUID;
  electronique_autonomie_id UUID;
  repair_cafe_id UUID;
  atelier_mercredi_semaine1_id UUID;
  atelier_mercredi_semaine2_id UUID;
  atelier_mercredi_semaine3_id UUID;
  atelier_mercredi_semaine4_id UUID;
  atelier_jeudi_semaine1_id UUID;
  atelier_jeudi_semaine2_id UUID;
  atelier_jeudi_semaine3_id UUID;
  atelier_jeudi_semaine4_id UUID;
  atelier_samedi_semaine4_id UUID;
BEGIN
  -- Calculate start date (next Monday)
  start_date := CURRENT_DATE;
  day_of_week := EXTRACT(DOW FROM start_date);
  -- PostgreSQL DOW: 0=Sunday, 1=Monday, ..., 6=Saturday
  -- If today is Monday (1), start today. Otherwise, go to next Monday
  IF day_of_week = 1 THEN
    start_date := start_date;
  ELSE
    start_date := start_date + (8 - day_of_week)::INTEGER;
  END IF;

  -- Get activity IDs
  SELECT id INTO menuiserie_autonomie_id FROM activity WHERE name = 'Menuiserie en autonomie';
  SELECT id INTO menuiserie_encadree_id FROM activity WHERE name = 'Menuiserie en autonomie encadrée';
  SELECT id INTO menuiserie_accompagnement_id FROM activity WHERE name = 'Accompagnement projet menuiserie';
  SELECT id INTO couture_autonomie_id FROM activity WHERE name = 'Couture en autonomie';
  SELECT id INTO couture_encadree_id FROM activity WHERE name = 'Couture en autonomie encadrée';
  SELECT id INTO ceramique_autonomie_id FROM activity WHERE name = 'Céramique en autonomie';
  SELECT id INTO ceramique_cuisson_id FROM activity WHERE name = 'Cuisson céramique';
  SELECT id INTO electronique_autonomie_id FROM activity WHERE name = 'Électronique en autonomie';
  SELECT id INTO repair_cafe_id FROM activity WHERE name = 'Repair Café';
  SELECT id INTO atelier_mercredi_semaine1_id FROM activity WHERE name = 'Travail du bois : Découpes et assemblages';
  SELECT id INTO atelier_mercredi_semaine2_id FROM activity WHERE name = 'Initiation à la défonceuse';
  SELECT id INTO atelier_mercredi_semaine3_id FROM activity WHERE name = 'Initiation tapisserie de mobilier';
  SELECT id INTO atelier_mercredi_semaine4_id FROM activity WHERE name = 'Formation au tour à bois';
  SELECT id INTO atelier_jeudi_semaine1_id FROM activity WHERE name = 'Initiation couture / Débutant';
  SELECT id INTO atelier_jeudi_semaine2_id FROM activity WHERE name = 'Créer ta planche à découper';
  SELECT id INTO atelier_jeudi_semaine3_id FROM activity WHERE name = 'Initiation couture/Intermédiaire';
  SELECT id INTO atelier_jeudi_semaine4_id FROM activity WHERE name = 'Initiation à assemblages traditionnels';
  SELECT id INTO atelier_samedi_semaine4_id FROM activity WHERE name = 'Initiation au patronage';

  -- Generate sessions for 4 weeks
  -- Opening hours: Mon=Fermé, Tue=13h-20h, Wed=9h-21h, Thu=13h-21h, Fri=13h-20h, Sat=10h-17h, Sun=Fermé
  FOR week_offset IN 0..3 LOOP
    session_date := start_date + (week_offset * 7);

    -- MONDAY - FERMÉ (no sessions)

    -- TUESDAY - 13h-20h
    session_date := start_date + (week_offset * 7) + 1;
    
    -- Menuiserie autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Menuiserie encadrée: 1 session x 2h = 2h (13h-15h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_encadree_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL);

    -- Couture autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Couture encadrée: 1 session x 2h = 2h (13h-15h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_encadree_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL);

    -- Céramique autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (ceramique_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- WEDNESDAY - 9h-21h
    session_date := start_date + (week_offset * 7) + 2;
    
    -- Menuiserie autonomie: 5 sessions x 2h = 10h (9h-11h, 11h-13h, 13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_autonomie_id, (session_date + INTERVAL '9 hours')::TIMESTAMPTZ, (session_date + INTERVAL '11 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '11 hours')::TIMESTAMPTZ, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Menuiserie encadrée: 1 session x 2h = 2h (13h-15h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_encadree_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL);

    -- Menuiserie accompagnement: 3 sessions x 1h = 3h (9h-10h, 10h-11h, 11h-12h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_accompagnement_id, (session_date + INTERVAL '9 hours')::TIMESTAMPTZ, (session_date + INTERVAL '10 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_accompagnement_id, (session_date + INTERVAL '10 hours')::TIMESTAMPTZ, (session_date + INTERVAL '11 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_accompagnement_id, (session_date + INTERVAL '11 hours')::TIMESTAMPTZ, (session_date + INTERVAL '12 hours')::TIMESTAMPTZ, NULL);

    -- Couture autonomie: 5 sessions x 2h = 10h (9h-11h, 11h-13h, 13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_autonomie_id, (session_date + INTERVAL '9 hours')::TIMESTAMPTZ, (session_date + INTERVAL '11 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '11 hours')::TIMESTAMPTZ, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Couture encadrée: 1 session x 2h = 2h (13h-15h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_encadree_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL);

    -- Céramique autonomie: 5 sessions x 2h = 10h (9h-11h, 11h-13h, 13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (ceramique_autonomie_id, (session_date + INTERVAL '9 hours')::TIMESTAMPTZ, (session_date + INTERVAL '11 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '11 hours')::TIMESTAMPTZ, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Electronique autonomie: 1 session x 2h = 2h (19h-21h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (electronique_autonomie_id, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, (session_date + INTERVAL '21 hours')::TIMESTAMPTZ, NULL);

    -- Atelier mercredi: 1 session x 3h = 3h (14h-17h) - Different atelier each week
    IF week_offset = 0 THEN
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_mercredi_semaine1_id, (session_date + INTERVAL '14 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL);
    ELSIF week_offset = 1 THEN
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_mercredi_semaine2_id, (session_date + INTERVAL '14 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL);
    ELSIF week_offset = 2 THEN
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_mercredi_semaine3_id, (session_date + INTERVAL '14 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL);
    ELSIF week_offset = 3 THEN
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_mercredi_semaine4_id, (session_date + INTERVAL '14 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL);
    END IF;

    -- THURSDAY - 13h-21h
    session_date := start_date + (week_offset * 7) + 3;
    
    -- Menuiserie autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Menuiserie encadrée: 1 session x 2h = 2h (13h-15h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_encadree_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL);

    -- Couture autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 18h-20h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '18 hours')::TIMESTAMPTZ, (session_date + INTERVAL '20 hours')::TIMESTAMPTZ, NULL);

    -- Couture encadrée: 1 session x 2h = 2h (13h-15h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_encadree_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL);

    -- Céramique autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (ceramique_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Atelier jeudi: 1 session x 3h = 3h (18h-21h) - Different atelier each week
    IF week_offset = 0 THEN
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_jeudi_semaine1_id, (session_date + INTERVAL '18 hours')::TIMESTAMPTZ, (session_date + INTERVAL '21 hours')::TIMESTAMPTZ, NULL);
    ELSIF week_offset = 1 THEN
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_jeudi_semaine2_id, (session_date + INTERVAL '18 hours')::TIMESTAMPTZ, (session_date + INTERVAL '21 hours')::TIMESTAMPTZ, NULL);
    ELSIF week_offset = 2 THEN
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_jeudi_semaine3_id, (session_date + INTERVAL '18 hours')::TIMESTAMPTZ, (session_date + INTERVAL '21 hours')::TIMESTAMPTZ, NULL);
    ELSIF week_offset = 3 THEN
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_jeudi_semaine4_id, (session_date + INTERVAL '18 hours')::TIMESTAMPTZ, (session_date + INTERVAL '21 hours')::TIMESTAMPTZ, NULL);
    END IF;

    -- FRIDAY - 13h-20h
    session_date := start_date + (week_offset * 7) + 4;
    
    -- Menuiserie autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (menuiserie_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Menuiserie encadrée: 1 session x 2h = 2h (13h-15h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_encadree_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL);

    -- Couture autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- Couture encadrée: 1 session x 2h = 2h (13h-15h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_encadree_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL);

    -- Céramique autonomie: 3 sessions x 2h = 6h (13h-15h, 15h-17h, 17h-19h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (ceramique_autonomie_id, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '15 hours')::TIMESTAMPTZ, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '17 hours')::TIMESTAMPTZ, (session_date + INTERVAL '19 hours')::TIMESTAMPTZ, NULL);

    -- SATURDAY - 10h-17h
    session_date := start_date + (week_offset * 7) + 5;
    
    -- Menuiserie encadrée: 1 session x 2h = 2h (10h-12h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (menuiserie_encadree_id, (session_date + INTERVAL '10 hours')::TIMESTAMPTZ, (session_date + INTERVAL '12 hours')::TIMESTAMPTZ, NULL);

    -- Couture autonomie: 2 sessions x 2h = 4h (10h-12h, 12h-14h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (couture_autonomie_id, (session_date + INTERVAL '10 hours')::TIMESTAMPTZ, (session_date + INTERVAL '12 hours')::TIMESTAMPTZ, NULL),
      (couture_autonomie_id, (session_date + INTERVAL '12 hours')::TIMESTAMPTZ, (session_date + INTERVAL '14 hours')::TIMESTAMPTZ, NULL);

    -- Céramique autonomie: 2 sessions x 2h = 4h (10h-12h, 12h-14h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (ceramique_autonomie_id, (session_date + INTERVAL '10 hours')::TIMESTAMPTZ, (session_date + INTERVAL '12 hours')::TIMESTAMPTZ, NULL),
      (ceramique_autonomie_id, (session_date + INTERVAL '12 hours')::TIMESTAMPTZ, (session_date + INTERVAL '14 hours')::TIMESTAMPTZ, NULL);

    -- Electronique autonomie: 1 session x 2h = 2h (14h-16h)
    INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
      (electronique_autonomie_id, (session_date + INTERVAL '14 hours')::TIMESTAMPTZ, (session_date + INTERVAL '16 hours')::TIMESTAMPTZ, NULL);

    -- Atelier samedi: Week 1-3 = Repair Café (3h), Week 4 = Initiation au patronage (3h)
    IF week_offset < 3 THEN
      -- Repair Café: 1 session x 3h = 3h (10h-13h)
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (repair_cafe_id, (session_date + INTERVAL '10 hours')::TIMESTAMPTZ, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, NULL);
    ELSIF week_offset = 3 THEN
      -- Atelier samedi semaine 4: Initiation au patronage
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations) VALUES
        (atelier_samedi_semaine4_id, (session_date + INTERVAL '10 hours')::TIMESTAMPTZ, (session_date + INTERVAL '13 hours')::TIMESTAMPTZ, NULL);
    END IF;

  END LOOP;
END $$;

