-- Revision: menuiserie courses content and June-July 2026 sessions.


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
