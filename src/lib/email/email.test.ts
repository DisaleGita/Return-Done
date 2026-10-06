// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoReturns } from "../demo-data";
import { escapeHtml, renderConfirmationEmail } from "./confirmation-email";
import { isRecipientAllowed } from "./recipients";

vi.mock("server-only", () => ({}));

const sendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: {
    createTestAccount: vi.fn(async () => ({
      user: "u",
      pass: "p",
      smtp: { host: "smtp.ethereal.email", port: 587, secure: false },
    })),
    createTransport: vi.fn(() => ({ sendMail })),
    getTestMessageUrl: vi.fn(() => "https://ethereal.email/message/abc123"),
  },
}));

const { sendConfirmationEmail } = await import("./send");

const record = createDemoReturns(new Date("2026-10-04T10:00")).find(
  (r) => r.status === "pickup_scheduled",
)!;

describe("renderConfirmationEmail", () => {
  it("includes the tracking number, pickup window, address and a tracking link", () => {
    const email = renderConfirmationEmail(record, "https://returndone.example/");
    expect(email.subject).toBe(`[TEST] Your Return Done pickup is scheduled (${record.id})`);
    for (const part of [record.id, "6 PM – 8 PM", "10 W 35th St", "Black blazer, size M"]) {
      expect(email.text).toContain(part);
      expect(email.html).toContain(part);
    }
    expect(email.html).toContain(`href="https://returndone.example/returns/${record.id}"`);
    // The disclaimer comes first, in both versions.
    expect(
      email.text.startsWith("TEST EMAIL: This is a test email from the Return Done demo website"),
    ).toBe(true);
    expect(email.html.indexOf("Test email")).toBeLessThan(
      email.html.indexOf("Your return is scheduled"),
    );
    expect(email.html).toContain("No real pickup has been scheduled");
  });

  it("escapes customer input so it can't inject HTML", () => {
    const hostile = {
      ...record,
      itemDescription: `<img src=x onerror="alert(1)">`,
      pickup: { ...record.pickup, instructions: "<script>steal()</script>" },
    };
    const { html } = renderConfirmationEmail(hostile, "https://returndone.example");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;steal()&lt;/script&gt;");
  });

  it("escapeHtml covers quotes and ampersands", () => {
    expect(escapeHtml(`H&M "quoted" 'single'`)).toBe("H&amp;M &quot;quoted&quot; &#39;single&#39;");
  });
});

describe("isRecipientAllowed", () => {
  it("allows everyone when the list is empty", () => {
    expect(isRecipientAllowed("a@b.com", undefined)).toBe(true);
    expect(isRecipientAllowed("a@b.com", " ")).toBe(true);
  });

  it("matches exact addresses and @domains, case-insensitively", () => {
    const list = "me@gmail.com, @returndone.app";
    expect(isRecipientAllowed("ME@gmail.com", list)).toBe(true);
    expect(isRecipientAllowed("ops@returndone.app", list)).toBe(true);
    expect(isRecipientAllowed("someone@gmail.com", list)).toBe(false);
    expect(isRecipientAllowed("x@evil-returndone.app.com", list)).toBe(false);
  });
});

describe("sendConfirmationEmail", () => {
  beforeEach(() => sendMail.mockReset().mockResolvedValue({ messageId: "1" }));
  afterEach(() => vi.unstubAllEnvs());

  it("sends for real automatically once SMTP credentials are set", async () => {
    vi.stubEnv("EMAIL_MODE", "");
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "me@gmail.com");
    vi.stubEnv("SMTP_PASS", "app-password");
    vi.stubEnv("EMAIL_ALLOWED_RECIPIENTS", "");
    expect(await sendConfirmationEmail(record, "alex@example.com")).toEqual({
      status: "sent",
      mode: "smtp",
    });
  });

  it("does nothing when no email settings exist (the default)", async () => {
    vi.stubEnv("EMAIL_MODE", "");
    vi.stubEnv("SMTP_HOST", "");
    const result = await sendConfirmationEmail(record, "alex@example.com");
    expect(result.status).toBe("skipped");
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("sends through Ethereal in test mode and returns a preview link", async () => {
    vi.stubEnv("EMAIL_MODE", "test");
    const result = await sendConfirmationEmail(record, "alex@example.com");
    expect(result).toEqual({
      status: "sent",
      mode: "test",
      previewUrl: "https://ethereal.email/message/abc123",
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alex@example.com",
        subject: expect.stringContaining(record.id),
      }),
    );
  });

  it("respects the allow-list in SMTP mode", async () => {
    vi.stubEnv("EMAIL_MODE", "smtp");
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_USER", "user");
    vi.stubEnv("SMTP_PASS", "pass");
    vi.stubEnv("EMAIL_ALLOWED_RECIPIENTS", "@returndone.app");
    expect((await sendConfirmationEmail(record, "stranger@gmail.com")).status).toBe("skipped");
    expect(await sendConfirmationEmail(record, "me@returndone.app")).toEqual({
      status: "sent",
      mode: "smtp",
    });
  });

  it("reports failure instead of throwing when sending fails", async () => {
    vi.stubEnv("EMAIL_MODE", "test");
    sendMail.mockRejectedValueOnce(new Error("SMTP down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendConfirmationEmail(record, "alex@example.com")).toEqual({ status: "failed" });
  });

  it("reports failure when SMTP mode is missing credentials", async () => {
    vi.stubEnv("EMAIL_MODE", "smtp");
    vi.stubEnv("SMTP_HOST", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendConfirmationEmail(record, "alex@example.com")).toEqual({ status: "failed" });
  });
});
