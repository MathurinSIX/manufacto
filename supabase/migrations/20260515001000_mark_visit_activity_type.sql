UPDATE activity
SET type = 'visite'
WHERE name ILIKE 'Venez découvrir l''atelier'
   OR name ILIKE 'Venez decouvrir l''atelier'
   OR name ILIKE 'Découverte de l''atelier'
   OR name ILIKE 'Decouverte de l''atelier'
   OR name ILIKE 'Visite de l''atelier';
