-- Add image_url column to activity table
ALTER TABLE activity
ADD COLUMN IF NOT EXISTS image_url TEXT;

