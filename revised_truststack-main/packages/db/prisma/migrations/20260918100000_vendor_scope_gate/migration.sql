-- Slice 3 addendum — an empty vendor register is not a declaration.
--
-- `VENDOR` is the only core domain whose every question hangs off one trigger
-- ("Mandatory where vendors exist"). Until now that trigger read the vendor
-- REGISTER: an organisation that had recorded no processors got no vendor
-- questions at all, and from Slice 5 would have lost the domain's 7 points.
--
-- But an empty register means nothing was recorded — not that no processor
-- exists. Inferring "none" from silence is exactly what D-026 forbids:
-- "unknown behaves as risk, never as no". An organisation that has not mapped
-- its supply chain has a finding, not an exemption.
--
-- So the question is asked explicitly. Only a documented `no` may scope the
-- domain out; `unknown` — the default, and the state of every organisation
-- that has not answered — keeps the vendor questions in the assessment (D-037).

ALTER TABLE "organization_scopes" ADD COLUMN "uses_data_processors" TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE public.organization_scopes
  ADD CONSTRAINT organization_scopes_uses_data_processors_check
    CHECK (uses_data_processors IN ('yes', 'no', 'unknown'));

-- Existing rows keep the safe default. An organisation that HAS recorded a
-- processor has already answered the question by its own register, so record
-- that rather than making a consultant re-answer it.
UPDATE public.organization_scopes s
SET uses_data_processors = 'yes'
WHERE EXISTS (
  SELECT 1 FROM public.vendors v
  WHERE v.organization_id = s.organization_id AND v.vendor_role = 'data_processor'
);

-- The column is part of the scope answers, so it rides the existing
-- organization_scopes grants, RLS policies and audit trigger. No new grant.
