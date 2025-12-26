-- Drop existing policy that restricts session reads to authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read sessions" ON session;

-- RLS Policies for session table
-- Allow everybody (public) to read sessions
CREATE POLICY "Allow public to read sessions"
  ON session FOR SELECT
  TO public
  USING (true);

