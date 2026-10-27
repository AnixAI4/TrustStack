import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/content/templates";
import { userOwnsTemplate } from "@/lib/template-purchases";

const FORMATS = {
  docx: {
    ext: "docx",
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  pdf: {
    ext: "pdf",
    contentType: "application/pdf",
  },
} as const;

type Format = keyof typeof FORMATS;

function isFormat(value: string | null): value is Format {
  return value === "docx" || value === "pdf";
}

/**
 * Authenticated download for purchased templates only.
 * Public /templates/*.(docx|pdf) stays blocked in middleware.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const template = getTemplate(slug);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formatParam = request.nextUrl.searchParams.get("format");
  if (!isFormat(formatParam)) {
    return NextResponse.json(
      { error: "Use ?format=docx or ?format=pdf" },
      { status: 400 }
    );
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
      { error: "Purchase required", code: "TEMPLATE_LOCKED" },
      { status: 402 }
    );
  }

  const { ext, contentType } = FORMATS[formatParam];
  const filePath = path.join(
    process.cwd(),
    "public",
    "templates",
    `${slug}.${ext}`
  );

  let bytes: Buffer;
  try {
    bytes = await readFile(filePath);
  } catch {
    console.error(`[templates] missing binary: ${filePath}`);
    return NextResponse.json(
      { error: "File not available. Please contact support." },
      { status: 404 }
    );
  }

  const filename = `${slug}.${ext}`;
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
