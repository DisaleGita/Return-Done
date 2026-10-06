// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDomainRules, checkEmailAddress, type DnsResolver } from "./address-check";
import { claimEmailSlot, createMemoryStore, hashEmail, readLimits } from "./quota";

const dnsError = (code: string) => Object.assign(new Error(code), { code });

function fakeDns(
  records: Record<string, { mx?: unknown[] | string; a?: unknown[] | string }>,
): DnsResolver {
  const lookup = (kind: "mx" | "a") => async (domain: string) => {
    const value = records[domain]?.[kind];
    if (value === undefined) throw dnsError("ENOTFOUND");
    if (typeof value === "string") throw dnsError(value);
    return value;
  };
  return { resolveMx: lookup("mx"), resolve4: lookup("a") };
}

describe("checkDomainRules", () => {
  it("rejects test and reserved domains", () => {
    for (const email of [
      "a@example.com",
      "a@shop.example.org",
      "a@mail.test",
      "a@localhost",
      "a@host.local",
    ]) {
      expect(checkDomainRules(email)).toEqual({
        ok: false,
        message: "Please use a real email address",
      });
    }
  });

  it("rejects disposable inboxes, including their subdomains", () => {
    for (const email of ["a@mailinator.com", "A@YOPMAIL.COM", "a@x.guerrillamail.com"]) {
      expect(checkDomainRules(email).ok).toBe(false);
    }
    expect(checkDomainRules("a@mailinator.com")).toMatchObject({
      message: expect.stringMatching(/permanent/),
    });
  });

  it("allows ordinary providers", () => {
    expect(checkDomainRules("someone@gmail.com")).toEqual({ ok: true });
    expect(checkDomainRules("someone@iit.edu")).toEqual({ ok: true });
  });
});

describe("checkEmailAddress", () => {
  const dns = fakeDns({
    "gmail.com": { mx: [{ exchange: "gmail-smtp-in.l.google.com" }] },
    "a-only.com": { mx: "ENODATA", a: ["93.184.216.34"] },
    "flaky.com": { mx: "ESERVFAIL" },
  });

  it("accepts domains with mail records", async () => {
    expect(await checkEmailAddress("me@gmail.com", dns)).toEqual({ ok: true });
  });

  it("accepts domains that only have an A record", async () => {
    expect(await checkEmailAddress("me@a-only.com", dns)).toEqual({ ok: true });
  });

  it("rejects domains that don't exist", async () => {
    expect(await checkEmailAddress("me@gmial-typo-xyz.com", dns)).toEqual({
      ok: false,
      message: "Please use a real email address",
    });
  });

  it("allows the address when DNS itself is failing or slow", async () => {
    expect(await checkEmailAddress("me@flaky.com", dns)).toEqual({ ok: true });
    const slow: DnsResolver = { resolveMx: () => new Promise(() => {}), resolve4: async () => [] };
    expect(await checkEmailAddress("me@slow.com", slow, 20)).toEqual({ ok: true });
  });

  it("doesn't touch DNS for reserved domains", async () => {
    const spy = { resolveMx: vi.fn(), resolve4: vi.fn() };
    await checkEmailAddress("me@example.com", spy);
    expect(spy.resolveMx).not.toHaveBeenCalled();
  });
});

describe("claimEmailSlot", () => {
  const limits = { maxRecipients: 50, maxPerRecipient: 3 };

  it("emails up to 50 different people, then stops", async () => {
    const store = createMemoryStore();
    for (let i = 1; i <= 50; i++) {
      expect(await claimEmailSlot(`person${i}@gmail.com`, limits, store)).toEqual({ ok: true });
    }
    const result = await claimEmailSlot("person51@gmail.com", limits, store);
    expect(result).toEqual({
      ok: false,
      reason: "This demo has already sent confirmation emails to its limit of 50 people",
    });
    // The 51st person doesn't take a place, so the count stays at 50.
    expect(await store.setSize("returndone:email:recipients")).toBe(50);
  });

  it("still lets the first 50 people book again, up to 3 emails each", async () => {
    const store = createMemoryStore();
    for (let i = 1; i <= 50; i++) await claimEmailSlot(`person${i}@gmail.com`, limits, store);
    expect(await claimEmailSlot("Person7@Gmail.com", limits, store)).toEqual({ ok: true });
    expect(await claimEmailSlot("person7@gmail.com", limits, store)).toEqual({ ok: true });
    expect(await claimEmailSlot("person7@gmail.com", limits, store)).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/already received 3 demo emails/),
    });
  });

  it("stores hashes, never the address", async () => {
    const store = createMemoryStore();
    const addToSet = vi.spyOn(store, "addToSet");
    await claimEmailSlot("private@gmail.com", limits, store);
    expect(addToSet).toHaveBeenCalledWith(expect.any(String), hashEmail("private@gmail.com"));
    expect(JSON.stringify(addToSet.mock.calls)).not.toContain("private@gmail.com");
  });
});

describe("findUpstashCredentials", () => {
  it("finds the Redis connection whatever prefix Vercel gave it", async () => {
    const { findUpstashCredentials } = await import("./quota");
    expect(
      findUpstashCredentials({ KV_REST_API_URL: "https://a", KV_REST_API_TOKEN: "t" }),
    ).toEqual({
      url: "https://a",
      token: "t",
    });
    expect(
      findUpstashCredentials({ STORAGE_REST_API_URL: "https://b", STORAGE_REST_API_TOKEN: "u" }),
    ).toEqual({ url: "https://b", token: "u" });
    expect(
      findUpstashCredentials({
        UPSTASH_REDIS_REST_URL: "https://c",
        UPSTASH_REDIS_REST_TOKEN: "v",
      }),
    ).toEqual({ url: "https://c", token: "v" });
    expect(findUpstashCredentials({ STORAGE_REST_API_URL: "https://b" })).toBeNull();
  });
});

describe("findRedisUrl", () => {
  it("finds a Redis connection string under any prefix", async () => {
    const { findRedisUrl } = await import("./redis-store");
    expect(findRedisUrl({ KV_REDIS_URL: "rediss://default:pw@host:6379" })).toBe(
      "rediss://default:pw@host:6379",
    );
    expect(findRedisUrl({ REDIS_URL: "redis://localhost:6379" })).toBe("redis://localhost:6379");
    expect(findRedisUrl({ KV_REDIS_URL: "https://not-redis" })).toBeNull();
    expect(findRedisUrl({})).toBeNull();
  });
});

describe("readLimits", () => {
  it("defaults to 50 people and 3 emails each, and EMAIL_MAX_RECIPIENTS=0 turns it off", () => {
    expect(readLimits({})).toEqual({ maxRecipients: 50, maxPerRecipient: 3 });
    expect(readLimits({ EMAIL_MAX_RECIPIENTS: "" })).toEqual({
      maxRecipients: 50,
      maxPerRecipient: 3,
    });
    expect(readLimits({ EMAIL_MAX_RECIPIENTS: "abc" })).toEqual({
      maxRecipients: 50,
      maxPerRecipient: 3,
    });
    expect(readLimits({ EMAIL_MAX_RECIPIENTS: "0" })).toBeNull();
    expect(readLimits({ EMAIL_MAX_RECIPIENTS: "50" })).toEqual({
      maxRecipients: 50,
      maxPerRecipient: 3,
    });
    expect(readLimits({ EMAIL_MAX_RECIPIENTS: "50", EMAIL_MAX_PER_RECIPIENT: "1" })).toEqual({
      maxRecipients: 50,
      maxPerRecipient: 1,
    });
  });
});

describe("sendConfirmationEmail with limits", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load() {
    vi.doMock("server-only", () => ({}));
    const sendMail = vi.fn().mockResolvedValue({ messageId: "1" });
    vi.doMock("nodemailer", () => ({
      default: { createTransport: vi.fn(() => ({ sendMail })), getTestMessageUrl: vi.fn() },
    }));
    const { sendConfirmationEmail } = await import("./send");
    const { createDemoReturns } = await import("../demo-data");
    return { sendConfirmationEmail, sendMail, record: createDemoReturns(new Date())[0]! };
  }

  function smtpEnv(extra: Record<string, string> = {}) {
    vi.stubEnv("EMAIL_MODE", "smtp");
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "demo@gmail.com");
    vi.stubEnv("SMTP_PASS", "x");
    vi.stubEnv("KV_REST_API_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("STORAGE_REST_API_URL", "");
    vi.stubEnv("KV_REDIS_URL", "");
    vi.stubEnv("REDIS_URL", "");
    for (const [key, value] of Object.entries(extra)) vi.stubEnv(key, value);
  }

  it("stops sending once the limit is reached", async () => {
    smtpEnv({ EMAIL_MAX_RECIPIENTS: "2", VERCEL: "" });
    const { sendConfirmationEmail, sendMail, record } = await load();
    expect((await sendConfirmationEmail(record, "a@gmail.com")).status).toBe("sent");
    expect((await sendConfirmationEmail(record, "b@gmail.com")).status).toBe("sent");
    expect(await sendConfirmationEmail(record, "c@gmail.com")).toMatchObject({ status: "skipped" });
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it("fails closed on Vercel when no Redis store is connected", async () => {
    smtpEnv({ EMAIL_MAX_RECIPIENTS: "50", VERCEL: "1" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendConfirmationEmail, sendMail, record } = await load();
    expect(await sendConfirmationEmail(record, "a@gmail.com")).toMatchObject({ status: "skipped" });
    expect(sendMail).not.toHaveBeenCalled();
  });
});
