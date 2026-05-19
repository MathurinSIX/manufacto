-- Unify course activities under a single type: cours
UPDATE activity
SET type = 'cours', updated_at = NOW()
WHERE type = 'atelier';
