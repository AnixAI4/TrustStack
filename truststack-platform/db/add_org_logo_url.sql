-- ============================================================================
-- M3 add-on: organization logo for the public Privacy Notice page
-- ----------------------------------------------------------------------------
-- Optional logo URL shown next to the organization name on /public/[slug].
-- Idempotent — safe to re-run. Run once in the Supabase SQL Editor.
-- ============================================================================

alter table public.organizations
  add column if not exists logo_url text;
