import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/content/templates";
import {
  getPurchasedSlugsFromUser,
  grantTemplatePurchase,
} from "@/lib/template-purchases";

/**
 * Dev-only: unlock a template without Razorpay when keys are missing.
 * Never available outside development.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!getTemplate(slug)) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }

  const grant = await grantTemplatePurchase(user.id, slug);
  if (!grant.ok) {
    return NextResponse.json({ error: grant.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    slug,
    purchased: grant.slugs,
    dev: true,
  });
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return NextResponse.json({
    purchased: getPurchasedSlugsFromUser(user),
  });
}
