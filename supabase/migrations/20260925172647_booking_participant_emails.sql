-- Names and optional emails for everyone on a booking.
-- participant_emails lines up with attendee order (empty string = no email).

ALTER TABLE registration
  ADD COLUMN IF NOT EXISTS participant_names TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS participant_emails TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public_session_subscription
  ADD COLUMN IF NOT EXISTS participant_names TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS participant_emails TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE square_purchase
  ADD COLUMN IF NOT EXISTS participant_names TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS participant_emails TEXT[] NOT NULL DEFAULT '{}';
