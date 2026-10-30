-- Slice 8 — the question bank becomes a black box to the client (D-040, D-068).
--
-- `question.read` lets every role read the questions its own assessments were
-- generated from. The WHOLE bank — all twenty packs, the draft overlays and
-- the reference pool, with their codes and triggers — is Anix's working view,
-- and now needs `question.read_bank`, held by the Super Admin and the Anix
-- Consultant only. The Organisation Admin, who holds every other permission,
-- does not get it: a client admin could otherwise hand a colleague the whole
-- bank by inviting them as a consultant. `assertCanAssignRole` now refuses
-- that invitation, because the consultant role holds a permission the admin
-- does not.
--
-- A matrix change is core + a migration in one PR (D-020);
-- `tests/unit/rbac-matrix.test.ts` reads this file.
--
-- No table, no policy: the bank stays SELECT-to-authenticated reference data
-- at the RLS layer, because generating an assessment reads it as the caller
-- (D-033). The black box is enforced in the API, which decides what a client
-- is shown — the bank is not tenant data, so this is presentation, not
-- isolation.

INSERT INTO public.permissions (code, description) VALUES
  ('question.read_bank', 'Browse the whole question bank: every pack, draft and reference included, with codes and triggers (Anix staff).');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES ('super_admin'), ('consultant')) AS g(role_code)
JOIN public.roles r ON r.code = g.role_code
JOIN public.permissions p ON p.code = 'question.read_bank';
