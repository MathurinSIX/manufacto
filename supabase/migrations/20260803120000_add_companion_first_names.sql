-- Store companion first names when booking for multiple people
ALTER TABLE registration
  ADD COLUMN IF NOT EXISTS companion_first_names TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public_session_subscription
  ADD COLUMN IF NOT EXISTS companion_first_names TEXT[] NOT NULL DEFAULT '{}';
