-- Fix JWT role check in RLS policies
-- The role is nested in app_metadata, not at the root of the JWT

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Allow admins to manage activities" ON activity;
DROP POLICY IF EXISTS "Allow admins to manage sessions" ON session;
DROP POLICY IF EXISTS "Admins can create registrations" ON registration;
DROP POLICY IF EXISTS "Admins can view all credits" ON credit;
DROP POLICY IF EXISTS "Admins can insert credits" ON credit;
DROP POLICY IF EXISTS "Admins can manage all registration statuses" ON registration_status;

-- RLS Policies for activity table
-- Allow admins to manage activities (using correct JWT role check)
CREATE POLICY "Allow admins to manage activities"
  ON activity FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- RLS Policies for session table
-- Allow admins to manage sessions (using correct JWT role check)
CREATE POLICY "Allow admins to manage sessions"
  ON session FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- RLS Policies for registration table
-- Admins can create registrations (but not update or delete)
CREATE POLICY "Admins can create registrations"
  ON registration FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- RLS Policies for credit table
-- Admins can view all credits
CREATE POLICY "Admins can view all credits"
  ON credit FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Admins can insert credits (but not update or delete)
CREATE POLICY "Admins can insert credits"
  ON credit FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- RLS Policies for registration_status table
-- Admins can manage all registration statuses (using correct JWT role check)
CREATE POLICY "Admins can manage all registration statuses"
  ON registration_status FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

