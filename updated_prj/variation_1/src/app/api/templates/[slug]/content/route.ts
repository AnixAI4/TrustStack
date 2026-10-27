import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/content/templates";
import { getTemplateDocument } from "@/content/template-documents";
import { userOwnsTemplate } from "@/lib/template-purchases";
import { templatePriceDisplay } from "@/lib/template-pricing";

/**
 * Streams template body only after purchase.
 * Cache-Control: no-store so browsers / intermediaries do not write the
 * document to disk. Content is meant for in-session on-screen reading only.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const template = getTemplate(slug);
  const doc = getTemplateDocument(slug);
  if (!template || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!userOwnsTemplate(user, slug)) {
    return NextResponse.json(
      {
        error: "Purchase required",
        code: "TEMPLATE_LOCKED",
        slug,
        priceDisplay: templatePriceDisplay(slug),
      },
      {
        status: 402,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  }

  return NextResponse.json(
    {
      slug,
      title: doc.title,
      sections: doc.sections,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
