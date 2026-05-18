-- Public bucket for activity images uploaded from the admin UI.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-images',
  'activity-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public read activity images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'activity-images');

CREATE POLICY "Admins can upload activity images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'activity-images'
    AND (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update activity images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'activity-images'
    AND (auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'activity-images'
    AND (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete activity images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'activity-images'
    AND (auth.jwt() ->> 'role') = 'admin'
  );
