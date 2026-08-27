-- Add Céramique en autonomie encadrée so it can be reserved and scheduled in admin.
INSERT INTO activity (name, type, nb_credits, description)
SELECT
  'Céramique en autonomie encadrée',
  'autonomie_encadree',
  3,
  'Sessions de céramique en autonomie avec encadrement. Une encadrante est présente dans l''espace et peut répondre à vos questions si besoin.'
WHERE NOT EXISTS (
  SELECT 1 FROM activity WHERE name = 'Céramique en autonomie encadrée'
);

UPDATE activity
SET
  type = 'autonomie_encadree',
  nb_credits = 3,
  deleted_at = NULL
WHERE name = 'Céramique en autonomie encadrée'
  AND (
    type IS DISTINCT FROM 'autonomie_encadree'
    OR nb_credits IS DISTINCT FROM 3
    OR deleted_at IS NOT NULL
  );
