ALTER TABLE registration
  ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 1
  CHECK (participant_count BETWEEN 1 AND 5);

ALTER TABLE public_session_subscription
  ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 1
  CHECK (participant_count BETWEEN 1 AND 5);

ALTER TABLE square_purchase
  ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 1
  CHECK (participant_count BETWEEN 1 AND 5);

CREATE OR REPLACE FUNCTION handle_registration_status_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_activity_id UUID;
  v_payment_type TEXT;
  v_nb_credits NUMERIC;
  v_participant_count INTEGER;
  v_credit_id UUID;
  v_credit_amount NUMERIC;
  v_reserved_start_ts TIMESTAMPTZ;
  v_reserved_end_ts TIMESTAMPTZ;
  v_reserved_hours NUMERIC := 1;
BEGIN
  IF NEW.credit_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'CANCELLED' AND EXISTS (
    SELECT 1
    FROM registration_status
    WHERE registration_id = NEW.registration_id
    AND status = 'CANCELLED'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT
    r.user_id,
    s.activity_id,
    r.payment_type,
    r.participant_count,
    r.reserved_start_ts,
    r.reserved_end_ts
  INTO
    v_user_id,
    v_activity_id,
    v_payment_type,
    v_participant_count,
    v_reserved_start_ts,
    v_reserved_end_ts
  FROM registration r
  INNER JOIN session s ON s.id = r.session_id
  WHERE r.id = NEW.registration_id;

  IF v_user_id IS NULL OR v_activity_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_payment_type IS NULL OR v_payment_type NOT IN ('credit', 'credits') THEN
    RETURN NEW;
  END IF;

  IF v_participant_count IS NULL OR v_participant_count < 1 THEN
    v_participant_count := 1;
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
    v_credit_amount := -(v_nb_credits * v_reserved_hours * v_participant_count);

    INSERT INTO credit (user_id, amount, payment_type)
    VALUES (v_user_id, v_credit_amount, 'registration')
    RETURNING id INTO v_credit_id;

    NEW.credit_id := v_credit_id;
  END IF;

  IF NEW.status = 'CANCELLED' THEN
    v_credit_amount := v_nb_credits * v_reserved_hours * v_participant_count;

    INSERT INTO credit (user_id, amount, payment_type)
    VALUES (v_user_id, v_credit_amount, 'cancellation')
    RETURNING id INTO v_credit_id;

    NEW.credit_id := v_credit_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
