-- Scanner entitlements: free = 1 lifetime preview; Pilot = 1/day; both can use prepaid ₹299 credits.
create or replace function public.can_user_scan(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_scans_today integer;
  v_free_preview_used boolean;
  v_scan_credits integer;
begin
  v_tier := public.get_user_tier(p_user_id);

  if v_tier = 'pilot' then
    select coalesce(scans_used, 0) into v_scans_today
    from public.daily_scan_usage
    where user_id = p_user_id and scan_date = current_date;

    if coalesce(v_scans_today, 0) < 1 then
      return jsonb_build_object(
        'can_scan', true,
        'tier', v_tier,
        'scan_type', 'pilot_daily',
        'scans_remaining', 1 - coalesce(v_scans_today, 0)
      );
    end if;

    select coalesce(scan_credits, 0) into v_scan_credits
    from public.user_entitlements
    where user_id = p_user_id;

    if coalesce(v_scan_credits, 0) > 0 then
      return jsonb_build_object(
        'can_scan', true,
        'tier', v_tier,
        'scan_type', 'prepaid',
        'scans_remaining', v_scan_credits,
        'message', 'Today''s Pilot scan used - using a paid full-scan credit.'
      );
    end if;

    return jsonb_build_object(
      'can_scan', false,
      'tier', v_tier,
      'reason', 'daily_limit_reached',
      'message', 'Today''s Pilot scan used. Buy an extra full scan for ₹299 or come back tomorrow.',
      'scans_remaining', 0
    );
  end if;

  select
    coalesce(free_scans_used, 0) >= 1,
    coalesce(scan_credits, 0)
  into v_free_preview_used, v_scan_credits
  from public.user_entitlements
  where user_id = p_user_id;

  if not coalesce(v_free_preview_used, false) then
    return jsonb_build_object(
      'can_scan', true,
      'tier', 'free',
      'scan_type', 'free_preview',
      'message', 'This is your free preview scan. Results will be limited.',
      'scans_remaining', 1
    );
  end if;

  if coalesce(v_scan_credits, 0) > 0 then
    return jsonb_build_object(
      'can_scan', true,
      'tier', 'free',
      'scan_type', 'prepaid',
      'scans_remaining', v_scan_credits
    );
  end if;

  return jsonb_build_object(
    'can_scan', false,
    'tier', 'free',
    'reason', 'payment_required',
    'message', 'Pay ₹299 per scan or upgrade to Pilot for daily scans.',
    'scans_remaining', 0
  );
end;
$$;
