CREATE TABLE IF NOT EXISTS square_product_mapping (
  internal_slug TEXT NOT NULL,
  catalog_object_id TEXT NOT NULL,
  catalog_label TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (internal_slug)
);

ALTER TABLE square_product_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read square product mappings"
  ON square_product_mapping FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admins to manage square product mappings"
  ON square_product_mapping FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');
