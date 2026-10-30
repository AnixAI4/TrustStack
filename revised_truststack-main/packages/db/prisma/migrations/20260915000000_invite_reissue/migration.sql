-- Invite emails (follow-up to Slice 1, D-025).
--
-- Invite links are now delivered by email and never shown to the inviter. We
-- only store the token's hash, so "resend invitation" cannot re-send the old
-- link: it must mint a new token. This RPC swaps the hash, restarts the 7-day
-- clock and audits it — the old link stops working at the same moment.
--
-- No schema change; same trust model as the Slice 1 RPCs (D-023).

CREATE OR REPLACE FUNCTION public.reissue_organization_invite(
  p_organization_id uuid,
  p_invite_id uuid,
  p_token_hash text
)
RETURNS TABLE (invite_id uuid, email text, role_code text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := app.current_user_id();
  v_invite public.organization_invites;
  v_role_code text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = 'TS401';
  END IF;
  IF NOT app.has_permission(p_organization_id, 'organization.users.invite') THEN
    RAISE EXCEPTION 'You do not have permission to invite users.' USING ERRCODE = 'TS403';
  END IF;

  -- Keyed by BOTH ids: another organisation's invite is simply "not found".
  SELECT * INTO v_invite FROM public.organization_invites i
  WHERE i.id = p_invite_id AND i.organization_id = p_organization_id
  FOR UPDATE;
  IF NOT FOUND OR v_invite.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation not found or already accepted.' USING ERRCODE = 'TS404';
  END IF;

  -- Re-sending grants the role again, so the escalation rule applies again.
  IF NOT app.can_grant_role(p_organization_id, v_invite.role_id) THEN
    RAISE EXCEPTION 'You cannot grant this role.' USING ERRCODE = 'TS403';
  END IF;

  UPDATE public.organization_invites i
  SET token_hash = p_token_hash,
      expires_at = now() + interval '7 days'
  WHERE i.id = v_invite.id
  RETURNING * INTO v_invite;

  SELECT r.code INTO v_role_code FROM public.roles r WHERE r.id = v_invite.role_id;

  INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, entity_id, description, metadata)
  VALUES (
    p_organization_id, v_actor, 'organization.invite.reissued', 'organization_invite', v_invite.id,
    'Re-issued an invitation; the previous link no longer works',
    jsonb_build_object('role', v_role_code, 'expiresAt', v_invite.expires_at)
  );

  RETURN QUERY SELECT v_invite.id, v_invite.email::text, v_role_code, v_invite.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.reissue_organization_invite(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reissue_organization_invite(uuid, uuid, text) TO authenticated;
