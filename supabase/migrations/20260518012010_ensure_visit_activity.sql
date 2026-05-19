-- Ensure a visit activity exists for discovery slot management and public reservations.
INSERT INTO activity (name, type, nb_credits, description)
SELECT
  'Venez découvrir l''atelier',
  'visite',
  NULL,
  'Visite gratuite de l''atelier et présentation du fonctionnement.'
WHERE NOT EXISTS (
  SELECT 1
  FROM activity
  WHERE type = 'visite'
    AND deleted_at IS NULL
);

-- Align legacy activity names with the visite type when present.
UPDATE activity
SET type = 'visite'
WHERE deleted_at IS NULL
  AND type IS DISTINCT FROM 'visite'
  AND (
    name ILIKE 'Venez découvrir l''atelier'
    OR name ILIKE 'Venez decouvrir l''atelier'
    OR name ILIKE 'Découverte de l''atelier'
    OR name ILIKE 'Decouverte de l''atelier'
    OR name ILIKE 'Visite de l''atelier'
  );
