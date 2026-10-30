import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isReservedTestAddress } from "@/lib/email/address";
import { EmailDeliveryError, EmailNotConfiguredError, sendEmail } from "@/lib/email/send";
import { EMAIL_NAVY, INVITE_WHAT_NEXT, renderInviteEmail } from "@/lib/email/templates/invite";
import { appOrigin } from "@/lib/invites/deliver";

const saved = { ...process.env };
beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test_key_not_real";
  process.env.INVITE_EMAIL_FROM = "TrustStack <no-reply@notify.truststack.co.in>";
});
afterEach(() => {
  process.env = { ...saved };
  vi.unstubAllEnvs();
});

const msg = { to: "person@mumbai-uni.ac.in", subject: "s", html: "<p>h</p>", text: "t" };

describe("isReservedTestAddress", () => {
  it("covers RFC 2606 / 6761 domains and their subdomains", () => {
    for (const e of [
      "a@example.com",
      "A@EXAMPLE.ORG",
      "x@mumbai-university.example.com",
      "x@foo.test",
      "x@foo.invalid",
      "x@host.localhost",
      "x@thing.example",
      "no-domain",
    ]) {
      expect(isReservedTestAddress(e), e).toBe(true);
    }
  });

  it("lets real domains through", () => {
    for (const e of ["spdanix@gmail.com", "registrar@mu.ac.in", "a@notexample.com", "a@example.com.in"]) {
      expect(isReservedTestAddress(e), e).toBe(false);
    }
  });
});

describe("sendEmail", () => {
  it("never calls the provider for a reserved test address", async () => {
    const fetchImpl = vi.fn();
    const r = await sendEmail({ ...msg, to: "e2e@example.com" }, fetchImpl as unknown as typeof fetch);
    expect(r).toEqual({ status: "suppressed", reason: "reserved_test_address" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts to Resend with the key, sender, idempotency key and both bodies", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "msg_123" }), { status: 200 }));
    const r = await sendEmail({ ...msg, idempotencyKey: "invite-1-abc" }, fetchImpl as unknown as typeof fetch);
    expect(r).toEqual({ status: "sent", provider: "resend", messageId: "msg_123" });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test_key_not_real");
    expect(headers["Idempotency-Key"]).toBe("invite-1-abc");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "TrustStack <no-reply@notify.truststack.co.in>",
      to: [msg.to],
      subject: "s",
      html: "<p>h</p>",
      text: "t",
    });
  });

  it("a provider rejection throws EmailDeliveryError with the status", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ name: "validation_error", message: "bad from" }), { status: 422 }));
    await expect(sendEmail(msg, fetchImpl as unknown as typeof fetch)).rejects.toMatchObject({
      name: "EmailDeliveryError",
      providerStatus: 422,
    });
  });

  it("a network failure throws EmailDeliveryError", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(sendEmail(msg, fetchImpl as unknown as typeof fetch)).rejects.toBeInstanceOf(EmailDeliveryError);
  });

  it("production without a provider fails loudly instead of dropping the invite", async () => {
    delete process.env.RESEND_API_KEY;
    vi.stubEnv("NODE_ENV", "production");
    await expect(sendEmail(msg, vi.fn() as unknown as typeof fetch)).rejects.toBeInstanceOf(EmailNotConfiguredError);
  });

  it("development without a provider logs and continues", async () => {
    delete process.env.INVITE_EMAIL_FROM;
    vi.stubEnv("NODE_ENV", "development");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const r = await sendEmail(msg, vi.fn() as unknown as typeof fetch);
    expect(r.status).toBe("logged");
    expect(String(info.mock.calls[0]?.[0])).not.toContain("<p>h</p>");
  });
});

describe("renderInviteEmail", () => {
  const base = {
    organizationName: "Mumbai University",
    roleName: "Legal User",
    inviterName: "MU Organisation Admin",
    inviteUrl: "https://revised-truststack-web.vercel.app/invites/accept?token=abc_DEF-123",
    expiresAt: "2026-09-22T10:00:00.000Z",
  };

  it("includes org, role, inviter, the real link and the IST expiry in both parts", () => {
    const { subject, html, text } = renderInviteEmail(base);
    expect(subject).toContain("Mumbai University");
    for (const part of [html, text]) {
      expect(part).toContain("Legal User");
      expect(part).toContain("MU Organisation Admin");
      expect(part).toContain("22 September 2026");
      expect(part).toContain("IST");
    }
    expect(text).toContain(base.inviteUrl);
    expect(html).toContain('href="https://revised-truststack-web.vercel.app/invites/accept?token=abc_DEF-123"');
    expect(text).toMatch(/does not certify compliance/);
  });

  it("says in one line what accepting asks, in the app's navy — not the old indigo (Slice 10.5 B4, F4.9)", () => {
    const { html, text } = renderInviteEmail(base);
    expect(text).toContain(INVITE_WHAT_NEXT);
    expect(html).toContain(INVITE_WHAT_NEXT);
    expect(INVITE_WHAT_NEXT).toBe(
      "When you accept, you will be asked to choose a password; TrustStack then opens on the DPDP readiness work your role covers.",
    );
    expect(html).toContain(`background:${EMAIL_NAVY}`);
    expect(EMAIL_NAVY).toBe("#003366");
    for (const file of ["invite", "intake", "vendor-link"]) {
      const source = readFileSync(path.resolve(import.meta.dirname, `../../lib/email/templates/${file}.ts`), "utf8");
      expect(source, file).not.toMatch(/#4338ca|#eef2ff/i);
    }
  });

  it("escapes user-controlled names in the HTML", () => {
    const { html } = renderInviteEmail({
      ...base,
      organizationName: `<img src=x onerror=alert(1)>`,
      inviterName: `"><script>alert(1)</script>`,
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("appOrigin — links point at our site, not the Host header", () => {
  it("production uses Vercel's production domain even if Host is forged", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "revised-truststack-web.vercel.app");
    expect(appOrigin(new Request("https://evil.example/api/v1/x"))).toBe("https://revised-truststack-web.vercel.app");
  });

  it("previews and local runs use the request origin", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(appOrigin(new Request("http://127.0.0.1:3100/api/v1/x"))).toBe("http://127.0.0.1:3100");
  });
});
