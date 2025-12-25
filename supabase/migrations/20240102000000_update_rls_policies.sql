-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Allow authenticated users to read activities" ON activity;
DROP POLICY IF EXISTS "Allow admins to manage activities" ON activity;
DROP POLICY IF EXISTS "Allow authenticated users to read sessions" ON session;
DROP POLICY IF EXISTS "Allow admins to manage sessions" ON session;
DROP POLICY IF EXISTS "Users can view their own registrations" ON registration;
DROP POLICY IF EXISTS "Users can create their own registrations" ON registration;
DROP POLICY IF EXISTS "Admins can view all registrations" ON registration;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON registration;
DROP POLICY IF EXISTS "Users can view their own credits" ON credit;
DROP POLICY IF EXISTS "Admins can view all credits" ON credit;
DROP POLICY IF EXISTS "Admins can manage all credits" ON credit;
DROP POLICY IF EXISTS "Users can view status of their own registrations" ON registration_status;
DROP POLICY IF EXISTS "Admins can view all registration statuses" ON registration_status;
DROP POLICY IF EXISTS "Users can create status for their own registrations" ON registration_status;
DROP POLICY IF EXISTS "Admins can manage all registration statuses" ON registration_status;

-- RLS Policies for activity table
-- Allow everybody (public) to read activities
CREATE POLICY "Allow public to read activities"
  ON activity FOR SELECT
  TO public
  USING (true);

-- Allow admins to manage activities (using JWT role check)
CREATE POLICY "Allow admins to manage activities"
  ON activity FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- RLS Policies for session table
-- Allow all authenticated users to read sessions
CREATE POLICY "Allow authenticated users to read sessions"
  ON session FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage sessions (using JWT role check)
CREATE POLICY "Allow admins to manage sessions"
  ON session FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- RLS Policies for registration table
-- Users can view all registrations (needed to see if a session is full)
CREATE POLICY "Users can view all registrations"
  ON registration FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own registrations
CREATE POLICY "Users can create their own registrations"
  ON registration FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can create registrations (but not update or delete)
CREATE POLICY "Admins can create registrations"
  ON registration FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- RLS Policies for credit table
-- Users can only see their own credits
CREATE POLICY "Users can view their own credits"
  ON credit FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all credits
CREATE POLICY "Admins can view all credits"
  ON credit FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Admins can insert credits (but not update or delete)
CREATE POLICY "Admins can insert credits"
  ON credit FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- RLS Policies for registration_status table
-- Users can view all registration statuses (needed to see if a session is full)
CREATE POLICY "Users can view all registration statuses"
  ON registration_status FOR SELECT
  TO authenticated
  USING (true);

-- Users can create registration status for their own registrations (for cancellation)
-- Only if the session is in the future
CREATE POLICY "Users can create status for their own registrations"
  ON registration_status FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM registration r
      INNER JOIN session s ON s.id = r.session_id
      WHERE r.id = registration_status.registration_id
      AND r.user_id = auth.uid()
      AND s.start_ts > NOW()
    )
  );

-- Admins can manage all registration statuses (using JWT role check)
CREATE POLICY "Admins can manage all registration statuses"
  ON registration_status FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

