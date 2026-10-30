/**
 * Slice 10 Stage 3a — the server half of public intake: the client key, the
 * code and its hash, the request schema, the refusals and the two emails a
 * Data Principal receives. The database half is tests/rls/intake.test.ts.
 */
import { createHash, createHmac } from "node:crypto";
import { BOARD_COMPLAINT_TEXT } from "@truststack/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatIndianDate, renderIntakeCodeEmail, renderIntakeReceiptEmail } from "@/lib/email/templates/intake";
import { clientAddress, clientKey, generateIntakeCode, hashIntakeCode } from "@/lib/intake/keys";
import { confirmSchema, refuse, slugOrNotFound, submissionIdOrNotFound, submissionSchema } from "@/lib/intake/routes";

const SECRET = "unit-test-cookie-secret-0123456789abcdef";
const req = (headers: Record<string, string> = {}) => new Request("http://localhost/api/v1/public/x/submissions", { headers });

describe("the client key — a keyed hash of the address, never the address", () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.ACTIVE_ORG_COOKIE_SECRET;
    process.env.ACTIVE_ORG_COOKIE_SECRET = SECRET;
  });
  afterEach(() => {
    process.env.ACTIVE_ORG_COOKIE_SECRET = saved;
  });

  it("takes the first forwarded address, then x-real-ip, then one shared bucket", () => {
    expect(clientAddress(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientAddress(req({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientAddress(req())).toBe("unknown");
  });

  it("is an HMAC with a purpose prefix — not a plain hash anyone could rebuild from the address", () => {
    const key = clientKey(req({ "x-forwarded-for": "203.0.113.7" }));
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).toBe(createHmac("sha256", SECRET).update("intake-client:203.0.113.7").digest("hex"));
    expect(key).not.toBe(createHash("sha256").update("203.0.113.7").digest("hex"));
    expect(key).not.toContain("203.0.113.7");
    expect(clientKey(req({ "x-forwarded-for": "203.0.113.8" }))).not.toBe(key);
  });

  it("refuses to run without the server secret", () => {
    process.env.ACTIVE_ORG_COOKIE_SECRET = "short";
    expect(() => clientKey(req())).toThrow(/ACTIVE_ORG_COOKIE_SECRET/);
  });
});

describe("codes", () => {
  it("are six digits, zero-padded, and differ", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateIntakeCode()));
    for (const c of codes) expect(c).toMatch(/^[0-9]{6}$/);
    expect(codes.size).toBeGreaterThan(190);
  });

  it("are stored as sha256(submission id : code) — the same code hashes differently for another submission", () => {
    const a = "6f2c8b1e-1111-4111-8111-111111111111";
    const b = "6f2c8b1e-2222-4222-8222-222222222222";
    expect(hashIntakeCode(a, "123456")).toBe(createHash("sha256").update(`${a}:123456`).digest("hex"));
    expect(hashIntakeCode(a, "123456")).not.toBe(hashIntakeCode(b, "123456"));
  });
});

describe("what a public form may send", () => {
  const valid = {
    surface: "rights",
    kind: "access",
    requesterName: "Asha Rao",
    requesterEmail: "asha@example.com",
    summary: "Please send me my marks record.",
  };

  it("accepts a request, trims it, and fills the defaults", () => {
    const parsed = submissionSchema.parse({ ...valid, requesterName: "  Asha Rao ", requesterPhone: "" });
    expect(parsed).toMatchObject({
      requesterName: "Asha Rao",
      requesterPhone: null,
      requesterCapacity: "self",
      principalIdentifier: null,
      relatedRequestCode: null,
      nominee: null,
    });
  });

  it("keeps each kind on its own form", () => {
    expect(submissionSchema.safeParse({ ...valid, kind: "grievance" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, surface: "grievance" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, surface: "grievance", kind: "grievance" }).success).toBe(true);
  });

  it("a nomination names its nominee, and nothing else does", () => {
    expect(submissionSchema.safeParse({ ...valid, kind: "nomination" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, kind: "nomination", nominee: { name: "Ravi Rao" } }).success).toBe(true);
    expect(submissionSchema.safeParse({ ...valid, nominee: { name: "Ravi Rao" } }).success).toBe(false);
  });

  it("only a grievance names an earlier request, by its reference, upper-cased", () => {
    const g = { ...valid, surface: "grievance", kind: "grievance" };
    expect(submissionSchema.parse({ ...g, relatedRequestCode: " dpr-2026-001 " }).relatedRequestCode).toBe("DPR-2026-001");
    expect(submissionSchema.parse({ ...g, relatedRequestCode: "" }).relatedRequestCode).toBeNull();
    expect(submissionSchema.safeParse({ ...g, relatedRequestCode: "my last request" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, relatedRequestCode: "DPR-2026-001" }).success).toBe(false);
  });

  it("refuses anything the register would not record, and anything too long", () => {
    expect(submissionSchema.safeParse({ ...valid, status: "responded" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, organizationId: "x" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, requesterEmail: "nobody" }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, summary: "x".repeat(4001) }).success).toBe(false);
    expect(submissionSchema.safeParse({ ...valid, requesterName: "" }).success).toBe(false);
  });

  it("a code is six digits", () => {
    expect(confirmSchema.safeParse({ code: "012345" }).success).toBe(true);
    expect(confirmSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(confirmSchema.safeParse({ code: "123456", extra: 1 }).success).toBe(false);
  });
});

describe("refusals", () => {
  it("a malformed slug or submission id is the same 404 as an unknown one", () => {
    for (const bad of [undefined, "Bad Slug", "-x", "a"]) {
      expect(() => slugOrNotFound(bad)).toThrow(expect.objectContaining({ status: 404, message: "This page is not available." }));
    }
    expect(slugOrNotFound("mumbai-university")).toBe("mumbai-university");
    expect(() => submissionIdOrNotFound("not-a-uuid")).toThrow(expect.objectContaining({ status: 404 }));
  });

  it("each travels with its status, its outcome, and nothing else", async () => {
    const r = refuse(req(), "rate_limited");
    expect(r.status).toBe(429);
    expect(r.headers.get("Retry-After")).toBe("3600");
    const body = await r.json();
    expect(body.error).toEqual({
      code: "RATE_LIMITED",
      message: "Too many attempts. Please wait an hour and try again.",
      details: [{ field: "outcome", issue: "rate_limited" }],
    });
    const wrong = await refuse(req(), "wrong_code", 1).json();
    expect(wrong.error.message).toBe("That code is not right. Check the email and try again. 1 try left.");
    expect(refuse(req(), "locked").status).toBe(410);
    expect(refuse(req(), "already_confirmed").status).toBe(409);
    expect(refuse(req(), "not_found").status).toBe(404);
  });
});

describe("the two emails — each names the Rule 9 contact", () => {
  const organization = {
    name: "Mumbai <University>",
    contact: { name: "Priya & Co", email: "dpo@mu.example.com", phone: null, isDpo: true },
  };

  it("the code email carries the code, its life, and that nothing happens without it — escaped", () => {
    const m = renderIntakeCodeEmail({ organization, code: "042137", kind: "erasure" });
    expect(m.subject).toBe("Your confirmation code for Mumbai <University>: 042137");
    expect(m.text).toContain("Your confirmation code: 042137");
    expect(m.text).toContain("within 10 minutes");
    expect(m.text).toContain("nothing is recorded unless the code is entered");
    expect(m.text).toContain("Priya & Co, Data Protection Officer · dpo@mu.example.com");
    expect(m.html).toContain("Mumbai &lt;University&gt;");
    expect(m.html).toContain("Priya &amp; Co");
    expect(m.html).not.toContain("<University>");
  });

  it("the receipt carries the reference, the day received and the respond-by date, with Rule 14(3)", () => {
    const m = renderIntakeReceiptEmail({
      organization,
      requestCode: "GRV-2026-004",
      kind: "grievance",
      receivedOn: "2026-10-13",
      respondBy: "2027-01-11",
    });
    expect(m.subject).toBe("Mumbai <University> received your grievance — GRV-2026-004");
    expect(m.text).toContain("Reference: GRV-2026-004");
    expect(m.text).toContain("Received on: 13 October 2026");
    expect(m.text).toContain("To be answered by: 11 January 2027 — within 90 days of receipt (DPDP Rules, 2025, Rule 14(3)).");
    expect(m.text).toContain("may ask you to confirm your identity");
    expect(m.text).toContain("Questions about your personal data: Priya & Co, Data Protection Officer");
    expect(m.html).toContain("GRV-2026-004");
    // A grievance says what comes after it (s.13(3)), in the notice's own words (Slice 10.5 B5, F5.6).
    expect(m.text).toContain(BOARD_COMPLAINT_TEXT);
    expect(m.html).toContain("Data Protection Board of India, after first using our grievance redressal (section 13(3) of the Act).");
  });

  it("a request's receipt does not carry the grievance line", () => {
    const m = renderIntakeReceiptEmail({ organization, requestCode: "DPR-2026-009", kind: "erasure", receivedOn: "2026-10-13", respondBy: "2027-01-11" });
    expect(m.text).not.toContain("Data Protection Board");
    expect(m.html).not.toContain("data-board");
  });

  it("a calendar date is formatted as that date, never shifted by a time zone", () => {
    expect(formatIndianDate("2026-12-31")).toBe("31 December 2026");
    expect(formatIndianDate("2027-01-01")).toBe("1 January 2027");
  });
});
