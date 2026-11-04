-- Run in Supabase SQL Editor BEFORE merging the birthdate feature.
-- Store only the declared date of birth; never collect ID photos or ID numbers.
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS birth_date date;
COMMENT ON COLUMN public.registrations.birth_date IS 'Self-declared date of birth for 18+ performer eligibility and in-person ID comparison. Restrict access and delete after event retention period.';
-- Existing registrations have NULL birth_date and must provide DOB before performing.
