-- Per-user assessment isolation within a shared organization workspace.
-- Apply this migration to existing projects after 00_core.sql.

alter table public.assessments enable row level security;
alter table public.assessment_answers enable row level security;
alter table public.assessment_gaps enable row level security;

drop policy if exists "org members manage assessments" on public.assessments;
drop policy if exists "users manage own assessments" on public.assessments;
create policy "users manage own assessments" on public.assessments
  for all using (
    created_by = auth.uid()
    and organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  ) with check (
    created_by = auth.uid()
    and organization_id in (
      select coalesce(om.organization_id, om.org_id)
      from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "org members manage assessment_answers" on public.assessment_answers;
drop policy if exists "users manage own assessment_answers" on public.assessment_answers;
create policy "users manage own assessment_answers" on public.assessment_answers
  for all using (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_answers.assessment_id
        and a.organization_id = assessment_answers.organization_id
        and a.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_answers.assessment_id
        and a.organization_id = assessment_answers.organization_id
        and a.created_by = auth.uid()
    )
  );

drop policy if exists "org members manage assessment_gaps" on public.assessment_gaps;
drop policy if exists "users manage own assessment_gaps" on public.assessment_gaps;
create policy "users manage own assessment_gaps" on public.assessment_gaps
  for all using (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_gaps.assessment_id
        and a.organization_id = assessment_gaps.organization_id
        and a.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.assessments a
      where a.id = assessment_gaps.assessment_id
        and a.organization_id = assessment_gaps.organization_id
        and a.created_by = auth.uid()
    )
  );

create index if not exists idx_assessments_owner
  on public.assessments (created_by, created_at desc);