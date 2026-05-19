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
  'pack_decouverte',
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
  'pack_decouverte',
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

UPDATE activity
SET type = 'pack_decouverte'
WHERE name IN ('Pack découverte couture', 'Pack découverte menuiserie');
