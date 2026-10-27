-- ============================================================================
-- TrustStack - FINAL question-security setup  (run THIS one file)
-- Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- SAFE / NON-DESTRUCTIVE: drops NO tables and deletes NO data. It only adds two
-- functions and locks the two question tables so the full bank can no longer be
-- bulk-downloaded from the browser. `risk_assessment` is left untouched.
-- Do NOT run master.sql again - that one rebuilds the tables from scratch.
--
-- WHY: A client-side quiz must download the questions it renders, so anyone can
-- read them in DevTools. The only way to stop the FULL bank being downloadable
-- is to keep it on the server and hand the browser just a small, RANDOM slice
-- per attempt. These functions do that; the lockdown at the bottom then blocks
-- direct bulk reads of the tables so the RPCs are the only way in.
--
-- The functions are SECURITY DEFINER, so they keep working after the lockdown
-- (they run as the table owner, bypassing the revoked SELECT).
-- ============================================================================

-- Random, capped slice of the certificate-exam bank.
create or replace function public.get_exam_questions(p_count int default 50)
returns setof public.exam_questions
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.exam_questions
  order by random()
  limit greatest(1, least(coalesce(p_count, 50), 60));
$$;

-- Random, capped slice of the FREE quiz set.
create or replace function public.get_quiz_sample(p_count int default 15)
returns setof public.quiz_questions
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.quiz_questions
  order by random()
  limit greatest(1, least(coalesce(p_count, 15), 20));
$$;

grant execute on function public.get_exam_questions(int) to anon, authenticated;
grant execute on function public.get_quiz_sample(int)    to anon, authenticated;

-- ----------------------------------------------------------------------------
-- HARD LOCKDOWN (recommended): block direct bulk SELECT so the ONLY way to read
-- questions is through the capped RPCs above. After this, a request like
--   GET /rest/v1/exam_questions?select=*
-- returns zero rows, while get_exam_questions()/get_quiz_sample() still work.
--
-- This DROPS NO TABLES and DELETES NO DATA. It only: (a) removes the permissive
-- "Public read access" policy that master.sql added to these two tables - that
-- policy (using (true)) is exactly what made every row bulk-readable - and
-- (b) revokes the direct SELECT grant. With RLS on and no permissive policy,
-- anon is denied even if a table grant lingers. SECURITY DEFINER functions are
-- unaffected (they run as the table owner). `risk_assessment` is left untouched.
-- ----------------------------------------------------------------------------
alter table public.exam_questions enable row level security;
alter table public.quiz_questions enable row level security;

drop policy if exists "Public read access" on public.exam_questions;
drop policy if exists "Public read access" on public.quiz_questions;

revoke select on public.exam_questions from anon, authenticated;
revoke select on public.quiz_questions from anon, authenticated;

-- Done. Quick checks after running:
--   select count(*) from get_exam_questions(50);  -- 50 random rows
--   select count(*) from get_quiz_sample(15);     -- 15 random rows
-- And a direct bulk read is now blocked (returns 0 rows / denied):
--   GET /rest/v1/exam_questions?select=*
