-- Slice 6 — a register for every assessment that was finalised BEFORE the
-- register existed.
--
-- From `20261002000000_gaps_actions` onwards, finalising an assessment
-- generates its gap register and freezes it with the score (D-058). An
-- assessment finalised earlier has a frozen score and NO register — and could
-- never get one, because the freeze refuses every write to a finalised
-- assessment's gaps, the generator's included.
--
-- The answers of a finalised assessment are locked, so deriving its gaps
-- today gives exactly the rows finalising would have written then. Two
-- things differ and cannot be recovered: `generated_at` is the backfill, not
-- the finalisation, and each action's default due date counts from today.
--
-- The freeze trigger is switched off for THIS statement block only, by the
-- migration role, and the block ends by asserting it is back on. On a fresh
-- database (CI) nothing is finalised and this does nothing.

ALTER TABLE public.assessment_gaps DISABLE TRIGGER assessment_gaps_frozen_when_finalised;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT a.organization_id, a.id
    FROM public.assessments a
    WHERE a.status = 'finalised'
      AND NOT EXISTS (
        SELECT 1 FROM public.assessment_gaps g
        WHERE g.organization_id = a.organization_id AND g.assessment_id = a.id
      )
  LOOP
    PERFORM app.refresh_assessment_gaps(r.organization_id, r.id);
  END LOOP;
END;
$$;

ALTER TABLE public.assessment_gaps ENABLE TRIGGER assessment_gaps_frozen_when_finalised;

DO $$
BEGIN
  ASSERT (
    SELECT t.tgenabled FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'assessment_gaps' AND t.tgname = 'assessment_gaps_frozen_when_finalised'
  ) = 'O', 'the freeze on a finalised register is enabled again';
END;
$$;
