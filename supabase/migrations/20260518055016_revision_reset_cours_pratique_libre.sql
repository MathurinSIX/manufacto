-- Revision: clear cours and pratique libre sessions (unbooked), then recreate
-- canonical activities and schedules (hourly practice May–Jul 2026, menuiserie cours).

-- ── 1. Clear unbooked sessions ───────────────────────────────────────────────

DELETE FROM session s
USING activity a
WHERE s.activity_id = a.id
  AND a.type = 'cours'
  AND NOT EXISTS (
    SELECT 1 FROM registration r WHERE r.session_id = s.id
  );

DELETE FROM session s
USING activity a
WHERE s.activity_id = a.id
  AND a.type IN ('autonomie', 'autonomie_encadree', 'accompagnement', 'cuisson')
  AND NOT EXISTS (
    SELECT 1 FROM registration r WHERE r.session_id = s.id
  );

-- ── 2. Pratique libre: activities + hourly openings (26 May – 18 Jul 2026) ───

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

-- ── 3. Cours: discovery packs ────────────────────────────────────────────────

INSERT INTO activity (
  name,
  type,
  nb_credits,
  price,
  description,
  square_product_id,
  level,
  audience,
  discipline
)
SELECT
  'Pack découverte couture',
  'cours',
  NULL,
  15,
  '2h de couture en autonomie encadrée, pour venir une première fois tester et découvrir l''atelier sans vous engager.',
  'decouverte-couture',
  'Découverte',
  'Débutant',
  'couture'
WHERE NOT EXISTS (
  SELECT 1
  FROM activity
  WHERE square_product_id = 'decouverte-couture'
     OR name = 'Pack découverte couture'
);

INSERT INTO activity (
  name,
  type,
  nb_credits,
  price,
  description,
  square_product_id,
  level,
  audience,
  discipline
)
SELECT
  'Pack découverte menuiserie',
  'cours',
  NULL,
  30,
  '2h de menuiserie en autonomie encadrée, pour venir une première fois tester et découvrir l''atelier sans vous engager.',
  'decouverte-menuiserie',
  'Découverte',
  'Débutant',
  'menuiserie'
WHERE NOT EXISTS (
  SELECT 1
  FROM activity
  WHERE square_product_id = 'decouverte-menuiserie'
     OR name = 'Pack découverte menuiserie'
);

-- ── 4. Cours: menuiserie catalogue + June–July 2026 sessions ───────────────


-- Initiation au travail du bois et fabrication d’un objet du quotidien
INSERT INTO activity (name, type, nb_credits, price, description, image_url, level, audience, discipline)
SELECT 'Initiation au travail du bois et fabrication d’un objet du quotidien', 'cours', 15, 72, '**Découvrir le travail du bois.**

Un premier atelier pour découvrir le bois et apprendre à confectionner des petits objets du quotidien.

Dans cet atelier, tu pourras choisir de fabriquer un jouet pour enfant, un ustensile de cuisine, ou un petit objet de décoration. Tu apprendras à te servir, en toute sécurité, d''outils pour couper, tailler et lisser le bois, pour rentrer chez toi avec un premier projet accompli en autonomie !

## Objectifs

- Découvrir les fondamentaux du travail du bois.
- S''approprier l''utilisation de quelques outils à main qui permettent de faire des petits projets en autonomie.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Prendre du plaisir dans la confection d''un objet et la découverte de ces techniques.

## Outils utilisés

- Scies égoïnes, scie japonaise, scie sauteuse, scie à chantourner
- Perceuse & visseuse
- Râpes, limes…

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.', '/assets/cours/Initiation au travail du bois et fabrication d’un objet du quotidien/Image.jpg', 'Débutant.e', 'Adulte et enfant (à partir de 6/7 ans)', 'menuiserie'
WHERE NOT EXISTS (
  SELECT 1 FROM activity WHERE name = 'Initiation au travail du bois et fabrication d’un objet du quotidien' AND deleted_at IS NULL
);

UPDATE activity
SET
  type = 'cours',
  nb_credits = 15,
  price = 72,
  description = '**Découvrir le travail du bois.**

Un premier atelier pour découvrir le bois et apprendre à confectionner des petits objets du quotidien.

Dans cet atelier, tu pourras choisir de fabriquer un jouet pour enfant, un ustensile de cuisine, ou un petit objet de décoration. Tu apprendras à te servir, en toute sécurité, d''outils pour couper, tailler et lisser le bois, pour rentrer chez toi avec un premier projet accompli en autonomie !

## Objectifs

- Découvrir les fondamentaux du travail du bois.
- S''approprier l''utilisation de quelques outils à main qui permettent de faire des petits projets en autonomie.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Prendre du plaisir dans la confection d''un objet et la découverte de ces techniques.

## Outils utilisés

- Scies égoïnes, scie japonaise, scie sauteuse, scie à chantourner
- Perceuse & visseuse
- Râpes, limes…

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.',
  image_url = '/assets/cours/Initiation au travail du bois et fabrication d’un objet du quotidien/Image.jpg',
  level = 'Débutant.e',
  audience = 'Adulte et enfant (à partir de 6/7 ans)',
  discipline = 'menuiserie',
  deleted_at = NULL
WHERE name = 'Initiation au travail du bois et fabrication d’un objet du quotidien';


-- Initiation aux assemblages traditionnels
INSERT INTO activity (name, type, nb_credits, price, description, image_url, level, audience, discipline)
SELECT 'Initiation aux assemblages traditionnels', 'cours', 15, 72, '**Mi-bois, tenon mortaises, tourillon.**

Découvre différentes façons d''assembler le bois massif, et apprend à construire des objets plus structurés grâce à ces premières techniques d''assemblage.

Un atelier pour aller plus loin dans le travail du bois en découvrant comment relier plusieurs pièces entre elles de manière solide et soignée. À travers la fabrication d''un petit objet utile ou décoratif, nous apprendrons ici à mesurer, tracer, visser et assembler différentes pièces de bois, pour rentrer chez soi avec un projet accompli en autonomie.

## Objectifs

- Découvrir les techniques traditionnelles d''assemblage du bois, et être à l''aise pour pouvoir les reproduire.
- S''approprier l''utilisation de quelques outils à main, permettant de commencer à travailler en autonomie.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Prendre du plaisir dans la confection d''un objet et la découverte de ces techniques.

## Outils utilisés

- Ciseaux à bois
- Scie japonaise, scie égoïnes
- Perceuse
- Mortaiseuse à bédane

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.', '/assets/cours/Initiation aux assemblages traditionnels/Image-7.jpg', 'Débutant.e', 'Adulte', 'menuiserie'
WHERE NOT EXISTS (
  SELECT 1 FROM activity WHERE name = 'Initiation aux assemblages traditionnels' AND deleted_at IS NULL
);

UPDATE activity
SET
  type = 'cours',
  nb_credits = 15,
  price = 72,
  description = '**Mi-bois, tenon mortaises, tourillon.**

Découvre différentes façons d''assembler le bois massif, et apprend à construire des objets plus structurés grâce à ces premières techniques d''assemblage.

Un atelier pour aller plus loin dans le travail du bois en découvrant comment relier plusieurs pièces entre elles de manière solide et soignée. À travers la fabrication d''un petit objet utile ou décoratif, nous apprendrons ici à mesurer, tracer, visser et assembler différentes pièces de bois, pour rentrer chez soi avec un projet accompli en autonomie.

## Objectifs

- Découvrir les techniques traditionnelles d''assemblage du bois, et être à l''aise pour pouvoir les reproduire.
- S''approprier l''utilisation de quelques outils à main, permettant de commencer à travailler en autonomie.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Prendre du plaisir dans la confection d''un objet et la découverte de ces techniques.

## Outils utilisés

- Ciseaux à bois
- Scie japonaise, scie égoïnes
- Perceuse
- Mortaiseuse à bédane

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.',
  image_url = '/assets/cours/Initiation aux assemblages traditionnels/Image-7.jpg',
  level = 'Débutant.e',
  audience = 'Adulte',
  discipline = 'menuiserie',
  deleted_at = NULL
WHERE name = 'Initiation aux assemblages traditionnels';


-- Découverte des machines stationnaires
INSERT INTO activity (name, type, nb_credits, price, description, image_url, level, audience, discipline)
SELECT 'Découverte des machines stationnaires', 'cours', 20, 100, '**Travailler le bois avec précision.**

Fais tes premiers pas avec les machines stationnaires de menuiserie et découvre leur potentiel pour transformer le bois avec précision.

Un atelier d''initiation aux machines stationnaires de l''atelier pour comprendre leur fonctionnement, leurs usages et les règles de sécurité indispensables. Ce cours t''apprendra à débiter, calibrer, déligner ou façonner le bois avec la scie à format et la dégauchisseuse/raboteuse, afin de gagner en qualité, en régularité et en précision dans tes réalisations.

## Objectifs

- Découvrir les principales machines stationnaires de menuiserie.
- Comprendre les usages et spécificités de chaque machine.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces machines.
- Développer autonomie et confiance dans un atelier de menuiserie.
- Découvrir quelques techniques de préparation du bois massif et des panneaux.
- Prendre du plaisir dans la découverte de ces machines et de leurs possibilités.

## Outils utilisés

- Scie à format
- Dégauchisseuse / Raboteuse

## À noter

Ce stage est obligatoire pour les personnes qui souhaitent utiliser ces deux machines en autonomie et qui ne peuvent pas justifier d''une formation professionnelle préalable.

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.', '/assets/cours/Découverte des machines stationnaires/Image-8.jpg', 'Intermédiaire', 'Adulte', 'menuiserie'
WHERE NOT EXISTS (
  SELECT 1 FROM activity WHERE name = 'Découverte des machines stationnaires' AND deleted_at IS NULL
);

UPDATE activity
SET
  type = 'cours',
  nb_credits = 20,
  price = 100,
  description = '**Travailler le bois avec précision.**

Fais tes premiers pas avec les machines stationnaires de menuiserie et découvre leur potentiel pour transformer le bois avec précision.

Un atelier d''initiation aux machines stationnaires de l''atelier pour comprendre leur fonctionnement, leurs usages et les règles de sécurité indispensables. Ce cours t''apprendra à débiter, calibrer, déligner ou façonner le bois avec la scie à format et la dégauchisseuse/raboteuse, afin de gagner en qualité, en régularité et en précision dans tes réalisations.

## Objectifs

- Découvrir les principales machines stationnaires de menuiserie.
- Comprendre les usages et spécificités de chaque machine.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces machines.
- Développer autonomie et confiance dans un atelier de menuiserie.
- Découvrir quelques techniques de préparation du bois massif et des panneaux.
- Prendre du plaisir dans la découverte de ces machines et de leurs possibilités.

## Outils utilisés

- Scie à format
- Dégauchisseuse / Raboteuse

## À noter

Ce stage est obligatoire pour les personnes qui souhaitent utiliser ces deux machines en autonomie et qui ne peuvent pas justifier d''une formation professionnelle préalable.

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.',
  image_url = '/assets/cours/Découverte des machines stationnaires/Image-8.jpg',
  level = 'Intermédiaire',
  audience = 'Adulte',
  discipline = 'menuiserie',
  deleted_at = NULL
WHERE name = 'Découverte des machines stationnaires';


-- Maîtriser l’outillage portatif de base
INSERT INTO activity (name, type, nb_credits, price, description, image_url, level, audience, discipline)
SELECT 'Maîtriser l’outillage portatif de base', 'cours', 15, 72, '**Perceuse / visseuse, ponceuse, scie sauteuse**

Fais tes premiers pas avec les outils électroportatifs, et découvre comment ils facilitent la fabrication et la transformation du bois.

Un atelier pour apprendre à utiliser les outils électroportatifs essentiels pour débuter en menuiserie, de manière progressive et sécurisée. En fabriquant un objet simple en bois, tu apprendras ici à te servir d''outils tels que la perceuse-visseuse, la scie sauteuse ou la ponceuse, pour gagner en efficacité et repartir avec un projet réalisé en autonomie.

## Objectifs

- Découvrir le bricolage avec ses premiers outils électroportatifs.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Comprendre les usages, limites et avantages de chaque outil.
- Prendre du plaisir dans la confection d''un objet et la découverte de ces techniques.

## Outils utilisés

- Perceuse / visseuse
- Scie sauteuse
- Ponceuses

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.', '/assets/cours/Maîtriser l’outillage portatif de base/Image-9.jpg', 'Débutant.e', 'Adulte', 'menuiserie'
WHERE NOT EXISTS (
  SELECT 1 FROM activity WHERE name = 'Maîtriser l’outillage portatif de base' AND deleted_at IS NULL
);

UPDATE activity
SET
  type = 'cours',
  nb_credits = 15,
  price = 72,
  description = '**Perceuse / visseuse, ponceuse, scie sauteuse**

Fais tes premiers pas avec les outils électroportatifs, et découvre comment ils facilitent la fabrication et la transformation du bois.

Un atelier pour apprendre à utiliser les outils électroportatifs essentiels pour débuter en menuiserie, de manière progressive et sécurisée. En fabriquant un objet simple en bois, tu apprendras ici à te servir d''outils tels que la perceuse-visseuse, la scie sauteuse ou la ponceuse, pour gagner en efficacité et repartir avec un projet réalisé en autonomie.

## Objectifs

- Découvrir le bricolage avec ses premiers outils électroportatifs.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Comprendre les usages, limites et avantages de chaque outil.
- Prendre du plaisir dans la confection d''un objet et la découverte de ces techniques.

## Outils utilisés

- Perceuse / visseuse
- Scie sauteuse
- Ponceuses

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.',
  image_url = '/assets/cours/Maîtriser l’outillage portatif de base/Image-9.jpg',
  level = 'Débutant.e',
  audience = 'Adulte',
  discipline = 'menuiserie',
  deleted_at = NULL
WHERE name = 'Maîtriser l’outillage portatif de base';


-- Fabriquer son porte-clés & apprendre à utiliser les différents types de scie
INSERT INTO activity (name, type, nb_credits, price, description, image_url, level, audience, discipline)
SELECT 'Fabriquer son porte-clés & apprendre à utiliser les différents types de scie', 'cours', 10, 72, '**scie à onglet, scie japonaise, scie à chantourner**

Viens fabriquer ton porte clef original, et profite-en pour découvrir les différents types de scies de l''atelier, ainsi que les bases du travail du bois et des petites finitions décoratives !

Tu apprendras ici à découper, percer, poncer et personnaliser différents matériaux, pour repartir avec un accessoire unique et utile, réalisé en autonomie !

## Objectifs

- Fabriquer un porte clef original.
- Découvrir le bricolage à travers un projet simple et créatif.
- Exprimer sa créativité à partir de différentes formes, matières et finitions.
- S''approprier l''utilisation de quelques outils à main, permettant de commencer à bricoler en autonomie.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Prendre du plaisir dans la confection d''un objet personnel et la découverte de ces techniques.

## Outils utilisés

- Scie à onglet
- Scie japonaise
- Scie à chantourner
- Ponceuse à bande

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.', '/assets/cours/Fabriquer son porte-clés & apprendre à utiliser les différents types de scie/Image-11.jpg', 'Débutant.e', 'Adulte et enfant (à partir de 6/7 ans)', 'menuiserie'
WHERE NOT EXISTS (
  SELECT 1 FROM activity WHERE name = 'Fabriquer son porte-clés & apprendre à utiliser les différents types de scie' AND deleted_at IS NULL
);

UPDATE activity
SET
  type = 'cours',
  nb_credits = 10,
  price = 72,
  description = '**scie à onglet, scie japonaise, scie à chantourner**

Viens fabriquer ton porte clef original, et profite-en pour découvrir les différents types de scies de l''atelier, ainsi que les bases du travail du bois et des petites finitions décoratives !

Tu apprendras ici à découper, percer, poncer et personnaliser différents matériaux, pour repartir avec un accessoire unique et utile, réalisé en autonomie !

## Objectifs

- Fabriquer un porte clef original.
- Découvrir le bricolage à travers un projet simple et créatif.
- Exprimer sa créativité à partir de différentes formes, matières et finitions.
- S''approprier l''utilisation de quelques outils à main, permettant de commencer à bricoler en autonomie.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Prendre du plaisir dans la confection d''un objet personnel et la découverte de ces techniques.

## Outils utilisés

- Scie à onglet
- Scie japonaise
- Scie à chantourner
- Ponceuse à bande

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.',
  image_url = '/assets/cours/Fabriquer son porte-clés & apprendre à utiliser les différents types de scie/Image-11.jpg',
  level = 'Débutant.e',
  audience = 'Adulte et enfant (à partir de 6/7 ans)',
  discipline = 'menuiserie',
  deleted_at = NULL
WHERE name = 'Fabriquer son porte-clés & apprendre à utiliser les différents types de scie';


-- Fabriquer un tabouret en bois
INSERT INTO activity (name, type, nb_credits, price, description, image_url, level, audience, discipline)
SELECT 'Fabriquer un tabouret en bois', 'cours', 15, 72, '**Du plan, à la découpe et l''assemblage**

Viens fabriquer un petit meuble en bois, et profite-en pour découvrir les bases de l''assemblage et de la fabrication de mobilier. Dans cet atelier, tu pourras réaliser un tabouret parmi les modèles proposés.

Tu apprendras à mesurer, découper, assembler et poncer le bois, pour rentrer chez soi avec un meuble pratique et unique, réalisé en autonomie.

## Objectifs

- Fabriquer un petit meuble en bois.
- Découvrir le travail du bois avec un premier projet concret.
- S''approprier l''utilisation de quelques outils à main, permettant de commencer à donner vie à ses projets en autonomie.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Prendre du plaisir dans la confection d''un objet utile et la découverte de ces techniques.

## Outils utilisés

- Scie à onglet
- Scie sauteuse
- Scie circulaire
- Ponceuse à bande
- Mortaiseuse à bédane

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.', '/assets/cours/Fabriquer un tabouret en bois/Image-12.jpg', 'Débutant.e', 'Adulte', 'menuiserie'
WHERE NOT EXISTS (
  SELECT 1 FROM activity WHERE name = 'Fabriquer un tabouret en bois' AND deleted_at IS NULL
);

UPDATE activity
SET
  type = 'cours',
  nb_credits = 15,
  price = 72,
  description = '**Du plan, à la découpe et l''assemblage**

Viens fabriquer un petit meuble en bois, et profite-en pour découvrir les bases de l''assemblage et de la fabrication de mobilier. Dans cet atelier, tu pourras réaliser un tabouret parmi les modèles proposés.

Tu apprendras à mesurer, découper, assembler et poncer le bois, pour rentrer chez soi avec un meuble pratique et unique, réalisé en autonomie.

## Objectifs

- Fabriquer un petit meuble en bois.
- Découvrir le travail du bois avec un premier projet concret.
- S''approprier l''utilisation de quelques outils à main, permettant de commencer à donner vie à ses projets en autonomie.
- Découvrir et comprendre un mode d''utilisation sécuritaire de ces outils.
- Prendre du plaisir dans la confection d''un objet utile et la découverte de ces techniques.

## Outils utilisés

- Scie à onglet
- Scie sauteuse
- Scie circulaire
- Ponceuse à bande
- Mortaiseuse à bédane

Pour tous les ateliers de menuiserie, nous recommandons de venir avec des chaussures fermées.',
  image_url = '/assets/cours/Fabriquer un tabouret en bois/Image-12.jpg',
  level = 'Débutant.e',
  audience = 'Adulte',
  discipline = 'menuiserie',
  deleted_at = NULL
WHERE name = 'Fabriquer un tabouret en bois';


DO $$
DECLARE
  v_activity_id UUID;
  v_course RECORD;
  v_session RECORD;
BEGIN
  FOR v_course IN
    SELECT * FROM (VALUES

      ('Initiation au travail du bois et fabrication d’un objet du quotidien'),
      ('Initiation aux assemblages traditionnels'),
      ('Découverte des machines stationnaires'),
      ('Maîtriser l’outillage portatif de base'),
      ('Fabriquer son porte-clés & apprendre à utiliser les différents types de scie'),
      ('Fabriquer un tabouret en bois')
    ) AS courses(name)
  LOOP
    SELECT id INTO v_activity_id
    FROM activity
    WHERE name = v_course.name
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_activity_id IS NULL THEN
      RAISE NOTICE 'Activity not found: %', v_course.name;
      CONTINUE;
    END IF;

    FOR v_session IN
      SELECT * FROM (VALUES

        ('Initiation au travail du bois et fabrication d’un objet du quotidien', '2026-06-03 14:00:00+02'::timestamptz, '2026-06-03 17:00:00+02'::timestamptz),
        ('Initiation au travail du bois et fabrication d’un objet du quotidien', '2026-06-11 17:00:00+02'::timestamptz, '2026-06-11 20:00:00+02'::timestamptz),
        ('Initiation au travail du bois et fabrication d’un objet du quotidien', '2026-07-09 17:00:00+02'::timestamptz, '2026-07-09 20:00:00+02'::timestamptz),
        ('Initiation aux assemblages traditionnels', '2026-06-20 09:00:00+02'::timestamptz, '2026-06-20 12:00:00+02'::timestamptz),
        ('Initiation aux assemblages traditionnels', '2026-06-25 17:00:00+02'::timestamptz, '2026-06-25 20:00:00+02'::timestamptz),
        ('Découverte des machines stationnaires', '2026-06-10 14:00:00+02'::timestamptz, '2026-06-10 17:00:00+02'::timestamptz),
        ('Découverte des machines stationnaires', '2026-06-18 17:00:00+02'::timestamptz, '2026-06-18 20:00:00+02'::timestamptz),
        ('Découverte des machines stationnaires', '2026-07-16 17:00:00+02'::timestamptz, '2026-07-16 20:00:00+02'::timestamptz),
        ('Maîtriser l’outillage portatif de base', '2026-06-24 14:00:00+02'::timestamptz, '2026-06-24 17:00:00+02'::timestamptz),
        ('Maîtriser l’outillage portatif de base', '2026-06-25 17:00:00+02'::timestamptz, '2026-06-25 20:00:00+02'::timestamptz),
        ('Fabriquer son porte-clés & apprendre à utiliser les différents types de scie', '2026-06-04 17:00:00+02'::timestamptz, '2026-06-04 20:00:00+02'::timestamptz),
        ('Fabriquer un tabouret en bois', '2026-06-17 14:00:00+02'::timestamptz, '2026-06-17 17:00:00+02'::timestamptz),
        ('Fabriquer un tabouret en bois', '2026-07-02 17:00:00+02'::timestamptz, '2026-07-02 20:00:00+02'::timestamptz)
      ) AS sessions(course_name, start_ts, end_ts)
      WHERE course_name = v_course.name
    LOOP
      INSERT INTO session (activity_id, start_ts, end_ts, max_registrations)
      SELECT v_activity_id, v_session.start_ts, v_session.end_ts, NULL
      WHERE NOT EXISTS (
        SELECT 1
        FROM session
        WHERE activity_id = v_activity_id
          AND start_ts = v_session.start_ts
      );
    END LOOP;
  END LOOP;
END $$;
