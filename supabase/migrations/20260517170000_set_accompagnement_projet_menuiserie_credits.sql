-- Aligns "Accompagnement projet menuiserie" credit cost with the public-facing
-- pricing displayed on /pratique-libre (4 crédits / heure). Without this, the
-- practice reservation modal cannot display the total cost in credits.
UPDATE activity
SET nb_credits = 4
WHERE name = 'Accompagnement projet menuiserie'
  AND nb_credits IS NULL;
