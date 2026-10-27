import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEVICE_COOKIE,
  DEVICE_COOKIE_MAX_AGE,
  createDeviceToken,
  hashDeviceToken,
  validDeviceToken,
} from "@/lib/security/device-session";

export const runtime = "nodejs";

function clientIp(request: NextRequest): string | null {
  const trusted =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    (process.env.VERCEL ? request.headers.get("x-forwarded-for") : null);
  const value = trusted?.split(",")[0]?.trim() ?? "";
  return /^[0-9a-f:.]+$/i.test(value) ? value : null;
}

export async function POST(request: NextRequest) {
  if (process.env.ENFORCE_DEVICE_SESSIONS !== "1") {
    return NextResponse.json({ enabled: false });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Session registry unavailable" }, { status: 503 });
  }

  const existing = request.cookies.get(DEVICE_COOKIE)?.value;
  const token = validDeviceToken(existing) ? existing : createDeviceToken();
  const deviceHash = await hashDeviceToken(token);
  const requestedMax = Number(process.env.MAX_CONCURRENT_DEVICES || "2");
  const maxDevices = Math.min(5, Math.max(1, Number.isFinite(requestedMax) ? requestedMax : 2));

  const { data, error } = await admin.rpc("register_device", {
    p_user_id: user.id,
    p_device_hash: deviceHash,
    p_ip: clientIp(request),
    p_user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    p_max_devices: maxDevices,
  });

  if (error) {
    console.error("Device registration failed:", error.message);
    return NextResponse.json({ error: "Session registry unavailable" }, { status: 503 });
  }

  const response = NextResponse.json({ enabled: true, ...(data as object) });
  response.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
  return response;
}
