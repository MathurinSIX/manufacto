-- Multiple images per activity (carousel on course detail pages).
ALTER TABLE activity
ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

-- Backfill from the existing single image_url column.
UPDATE activity
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND image_url <> ''
  AND (image_urls IS NULL OR cardinality(image_urls) = 0);

-- Seed known course galleries from public/assets/cours.
UPDATE activity
SET image_urls = ARRAY[
  '/assets/cours/Initiation au travail du bois et fabrication d’un objet du quotidien/Image.jpg',
  '/assets/cours/Initiation au travail du bois et fabrication d’un objet du quotidien/Image-6.jpg',
  '/assets/cours/Initiation au travail du bois et fabrication d’un objet du quotidien/Image-13.jpg',
  '/assets/cours/Initiation au travail du bois et fabrication d’un objet du quotidien/Image-14.jpg',
  '/assets/cours/Initiation au travail du bois et fabrication d’un objet du quotidien/Image-15.jpg'
]
WHERE name = 'Initiation au travail du bois et fabrication d’un objet du quotidien'
  AND deleted_at IS NULL;

UPDATE activity
SET image_urls = ARRAY[
  '/assets/cours/Initiation aux assemblages traditionnels/Image-7.jpg',
  '/assets/cours/Initiation aux assemblages traditionnels/Image-1.jpg'
]
WHERE name = 'Initiation aux assemblages traditionnels'
  AND deleted_at IS NULL;

UPDATE activity
SET image_urls = ARRAY[
  '/assets/cours/Découverte des machines stationnaires/Image-8.jpg',
  '/assets/cours/Découverte des machines stationnaires/Image-2.jpg'
]
WHERE name = 'Découverte des machines stationnaires'
  AND deleted_at IS NULL;

UPDATE activity
SET image_urls = ARRAY[
  '/assets/cours/Maîtriser l’outillage portatif de base/Image-9.jpg',
  '/assets/cours/Maîtriser l’outillage portatif de base/Image-4.jpg'
]
WHERE name = 'Maîtriser l’outillage portatif de base'
  AND deleted_at IS NULL;

UPDATE activity
SET image_urls = ARRAY[
  '/assets/cours/Fabriquer son porte-clés & apprendre à utiliser les différents types de scie/Image-11.jpg',
  '/assets/cours/Fabriquer son porte-clés & apprendre à utiliser les différents types de scie/Image-5.jpg'
]
WHERE name = 'Fabriquer son porte-clés & apprendre à utiliser les différents types de scie'
  AND deleted_at IS NULL;

UPDATE activity
SET image_urls = ARRAY[
  '/assets/cours/Fabriquer un tabouret en bois/Image-12.jpg',
  '/assets/cours/Fabriquer un tabouret en bois/Image-3.jpg',
  '/assets/cours/Fabriquer un tabouret en bois/Image-10.jpg'
]
WHERE name = 'Fabriquer un tabouret en bois'
  AND deleted_at IS NULL;
