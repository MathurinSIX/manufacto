ALTER TABLE square_product_mapping
  DROP CONSTRAINT IF EXISTS square_product_mapping_internal_slug_fkey;

ALTER TABLE square_product_mapping
  DROP CONSTRAINT IF EXISTS square_product_mapping_environment_check;

ALTER TABLE square_product_mapping
  DROP CONSTRAINT IF EXISTS square_product_mapping_pkey;

CREATE TEMP TABLE square_product_mapping_dedup AS
SELECT DISTINCT ON (internal_slug)
  internal_slug,
  catalog_object_id,
  catalog_label,
  updated_at
FROM square_product_mapping
ORDER BY internal_slug, updated_at DESC;

TRUNCATE square_product_mapping;

ALTER TABLE square_product_mapping
  DROP COLUMN IF EXISTS environment;

INSERT INTO square_product_mapping (
  internal_slug,
  catalog_object_id,
  catalog_label,
  updated_at
)
SELECT
  internal_slug,
  catalog_object_id,
  catalog_label,
  updated_at
FROM square_product_mapping_dedup;

DROP TABLE square_product_mapping_dedup;

ALTER TABLE square_product_mapping
  ADD PRIMARY KEY (internal_slug);

DROP TABLE IF EXISTS square_catalog_product;
