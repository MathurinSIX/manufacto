ALTER TABLE activity
  ADD COLUMN IF NOT EXISTS discipline TEXT;

-- Backfill from "discipline/title" naming convention
UPDATE activity
SET discipline = lower(trim(split_part(name, '/', 1)))
WHERE type = 'cours'
  AND discipline IS NULL
  AND position('/' in name) > 0
  AND lower(trim(split_part(name, '/', 1))) IN (
    'menuiserie',
    'couture',
    'electronique',
    'ceramique'
  );

-- Infer discipline from course names when missing
UPDATE activity
SET discipline = 'menuiserie'
WHERE type = 'cours'
  AND discipline IS NULL
  AND (
    name ILIKE '%menuiserie%'
    OR name ILIKE '%bois%'
    OR name ILIKE '%défonceuse%'
    OR name ILIKE '%defonceuse%'
    OR name ILIKE '%tour à bois%'
    OR name ILIKE '%tour a bois%'
    OR name ILIKE '%tapisserie%'
    OR name ILIKE '%assemblage%'
    OR name ILIKE '%planche à découper%'
    OR name ILIKE '%planche a decouper%'
  );

UPDATE activity
SET discipline = 'couture'
WHERE type = 'cours'
  AND discipline IS NULL
  AND (
    name ILIKE '%couture%'
    OR name ILIKE '%patronage%'
  );

UPDATE activity
SET discipline = 'electronique'
WHERE type = 'cours'
  AND discipline IS NULL
  AND (
    name ILIKE '%repair café%'
    OR name ILIKE '%repair cafe%'
    OR name ILIKE '%électronique%'
    OR name ILIKE '%electronique%'
  );
