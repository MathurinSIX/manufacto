-- Create activity table
CREATE TABLE IF NOT EXISTS activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nb_credits NUMERIC,
  type TEXT NOT NULL,
  price NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session table
CREATE TABLE IF NOT EXISTS session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activity(id) ON DELETE CASCADE,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ NOT NULL,
  max_registrations INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create registration table
CREATE TABLE IF NOT EXISTS registration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit table
CREATE TABLE IF NOT EXISTS credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create registration_status table
CREATE TABLE IF NOT EXISTS registration_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registration(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  credit_id UUID REFERENCES credit(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_session_activity_id ON session(activity_id);
CREATE INDEX IF NOT EXISTS idx_session_start_ts ON session(start_ts);
CREATE INDEX IF NOT EXISTS idx_registration_user_id ON registration(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_session_id ON registration(session_id);
CREATE INDEX IF NOT EXISTS idx_credit_user_id ON credit(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_status_registration_id ON registration_status(registration_id);
CREATE INDEX IF NOT EXISTS idx_registration_status_credit_id ON registration_status(credit_id);
CREATE INDEX IF NOT EXISTS idx_registration_status_created_at ON registration_status(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity table
-- Allow all authenticated users to read activities
CREATE POLICY "Allow authenticated users to read activities"
  ON activity FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage activities
CREATE POLICY "Allow admins to manage activities"
  ON activity FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for session table
-- Allow all authenticated users to read sessions
CREATE POLICY "Allow authenticated users to read sessions"
  ON session FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage sessions
CREATE POLICY "Allow admins to manage sessions"
  ON session FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for registration table
-- Users can only see their own registrations
CREATE POLICY "Users can view their own registrations"
  ON registration FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own registrations
CREATE POLICY "Users can create their own registrations"
  ON registration FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
  ON registration FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can manage all registrations
CREATE POLICY "Admins can manage all registrations"
  ON registration FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can manage all credits
CREATE POLICY "Admins can manage all credits"
  ON credit FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for registration_status table
-- Users can view registration status for their own registrations
CREATE POLICY "Users can view status of their own registrations"
  ON registration_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registration
      WHERE registration.id = registration_status.registration_id
      AND registration.user_id = auth.uid()
    )
  );

-- Admins can view all registration statuses
CREATE POLICY "Admins can view all registration statuses"
  ON registration_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

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

-- Admins can manage all registration statuses
CREATE POLICY "Admins can manage all registration statuses"
  ON registration_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_activity_updated_at
  BEFORE UPDATE ON activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_updated_at
  BEFORE UPDATE ON session
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle credit deduction/refund based on registration status
CREATE OR REPLACE FUNCTION handle_registration_status_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_activity_id UUID;
  v_nb_credits NUMERIC;
  v_credit_id UUID;
  v_credit_amount NUMERIC;
BEGIN
  -- Only process if credit_id is not already set
  IF NEW.credit_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get user_id and activity_id from registration and session
  SELECT 
    r.user_id,
    s.activity_id
  INTO 
    v_user_id,
    v_activity_id
  FROM registration r
  INNER JOIN session s ON s.id = r.session_id
  WHERE r.id = NEW.registration_id;

  -- If no registration found, return
  IF v_user_id IS NULL OR v_activity_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get nb_credits from activity
  SELECT nb_credits INTO v_nb_credits
  FROM activity
  WHERE id = v_activity_id;

  -- Only process if activity has credits defined
  IF v_nb_credits IS NULL OR v_nb_credits <= 0 THEN
    RETURN NEW;
  END IF;

  -- Handle CONFIRMED status: deduct credits (negative amount)
  IF NEW.status = 'CONFIRMED' THEN
    -- Create a credit entry with negative amount to deduct credits
    v_credit_amount := -v_nb_credits;
    
    INSERT INTO credit (user_id, amount, payment_type)
    VALUES (v_user_id, v_credit_amount, 'registration')
    RETURNING id INTO v_credit_id;

    -- Set the credit_id in the registration_status
    NEW.credit_id := v_credit_id;
  END IF;

  -- Handle CANCELLED status: refund credits (positive amount)
  IF NEW.status = 'CANCELLED' THEN
    -- Create a credit entry with positive amount to refund credits
    v_credit_amount := v_nb_credits;
    
    INSERT INTO credit (user_id, amount, payment_type)
    VALUES (v_user_id, v_credit_amount, 'cancellation')
    RETURNING id INTO v_credit_id;

    -- Set the credit_id in the registration_status
    NEW.credit_id := v_credit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically handle credits when registration status changes
-- Using BEFORE INSERT so we can set the credit_id in the same row
CREATE TRIGGER handle_registration_status_credits_trigger
  BEFORE INSERT ON registration_status
  FOR EACH ROW
  EXECUTE FUNCTION handle_registration_status_credits();

-- Function to automatically create CONFIRMED status when a registration is created
CREATE OR REPLACE FUNCTION auto_create_registration_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically create a CONFIRMED status for the new registration
  INSERT INTO registration_status (registration_id, status)
  VALUES (NEW.id, 'CONFIRMED');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create CONFIRMED status when registration is created
CREATE TRIGGER auto_create_registration_status_trigger
  AFTER INSERT ON registration
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_registration_status();

