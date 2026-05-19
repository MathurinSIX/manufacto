ALTER TABLE registration
  ADD COLUMN IF NOT EXISTS reserved_start_ts TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reserved_end_ts TIMESTAMPTZ;

ALTER TABLE registration
  ADD CONSTRAINT registration_reserved_interval_valid
  CHECK (
    (reserved_start_ts IS NULL AND reserved_end_ts IS NULL)
    OR (reserved_start_ts IS NOT NULL AND reserved_end_ts IS NOT NULL AND reserved_end_ts > reserved_start_ts)
  );

CREATE INDEX IF NOT EXISTS idx_registration_reserved_interval
  ON registration(session_id, reserved_start_ts, reserved_end_ts)
  WHERE reserved_start_ts IS NOT NULL AND reserved_end_ts IS NOT NULL;

DROP POLICY IF EXISTS "Users can create status for their own registrations"
  ON registration_status;

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
      AND COALESCE(r.reserved_start_ts, s.start_ts) > NOW()
    )
  );

CREATE OR REPLACE FUNCTION handle_registration_status_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_activity_id UUID;
  v_nb_credits NUMERIC;
  v_credit_id UUID;
  v_credit_amount NUMERIC;
  v_reserved_start_ts TIMESTAMPTZ;
  v_reserved_end_ts TIMESTAMPTZ;
  v_reserved_hours NUMERIC := 1;
BEGIN
  IF NEW.credit_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    r.user_id,
    s.activity_id,
    r.reserved_start_ts,
    r.reserved_end_ts
  INTO
    v_user_id,
    v_activity_id,
    v_reserved_start_ts,
    v_reserved_end_ts
  FROM registration r
  INNER JOIN session s ON s.id = r.session_id
  WHERE r.id = NEW.registration_id;

  IF v_user_id IS NULL OR v_activity_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT nb_credits INTO v_nb_credits
  FROM activity
  WHERE id = v_activity_id;

  IF v_nb_credits IS NULL OR v_nb_credits <= 0 THEN
    RETURN NEW;
  END IF;

  IF v_reserved_start_ts IS NOT NULL AND v_reserved_end_ts IS NOT NULL THEN
    v_reserved_hours := EXTRACT(EPOCH FROM (v_reserved_end_ts - v_reserved_start_ts)) / 3600;
  END IF;

  IF v_reserved_hours <= 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'CONFIRMED' THEN
    v_credit_amount := -(v_nb_credits * v_reserved_hours);

    INSERT INTO credit (user_id, amount, payment_type)
    VALUES (v_user_id, v_credit_amount, 'registration')
    RETURNING id INTO v_credit_id;

    NEW.credit_id := v_credit_id;
  END IF;

  IF NEW.status = 'CANCELLED' THEN
    v_credit_amount := v_nb_credits * v_reserved_hours;

    INSERT INTO credit (user_id, amount, payment_type)
    VALUES (v_user_id, v_credit_amount, 'cancellation')
    RETURNING id INTO v_credit_id;

    NEW.credit_id := v_credit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
