// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDays, toISODate } from "@/lib/dates";

vi.mock("server-only", () => ({}));
// Apply the offline address rules, but don't do real DNS lookups in tests.
vi.mock("@/lib/email/address-check", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/email/address-check")>();
  return { ...actual, checkEmailAddress: async (email: string) => actual.checkDomainRules(email) };
});

const { POST: createReturn } = await import("./returns/route");
const { POST: analyze, GET: engine } = await import("./assistant/route");

const json = (body: unknown) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const validReturn = () => ({
  retailerId: "nike",
  retailerName: "Nike",
  itemDescription: "Air Max sneakers",
  itemCount: 1,
  contactEmail: "alex@gmail.com",
  pickup: {
    date: toISODate(addDays(new Date(), 3)),
    windowId: "10-12",
    address: { line1: "10 W 35th St", city: "Chicago", state: "IL", zip: "60616" },
  },
});

describe("POST /api/returns", () => {
  beforeEach(() => vi.stubEnv("EMAIL_MODE", "off")); // never send real email from tests
  afterEach(() => vi.unstubAllEnvs());

  it("creates a scheduled return with a tracking number and price", async () => {
    const response = await createReturn(json(validReturn()));
    expect(response.status).toBe(201);
    const { return: record } = await response.json();
    expect(record.id).toMatch(/^RD-\d{4}-\d{4}$/);
    expect(record.status).toBe("pickup_scheduled");
    expect(record.price.total).toBeGreaterThan(0);
  });

  it("requires a valid email address and never stores it", async () => {
    const missing = await createReturn(json({ ...validReturn(), contactEmail: undefined }));
    expect(missing.status).toBe(422);
    expect((await missing.json()).fieldErrors.contactEmail).toBe(
      "Enter your email so we can send your confirmation",
    );

    const bad = await createReturn(json({ ...validReturn(), contactEmail: "not-an-email" }));
    expect(bad.status).toBe(422);
    expect((await bad.json()).fieldErrors.contactEmail).toBe("Enter a valid email address");

    const ok = await (await createReturn(json(validReturn()))).json();
    expect(ok.return).not.toHaveProperty("contactEmail");
    expect(ok.email.status).toBe("skipped");
  });

  it("turns away mistyped provider domains with a suggestion", async () => {
    const response = await createReturn(
      json({ ...validReturn(), contactEmail: "customer@gnail.com" }),
    );
    expect(response.status).toBe(422);
    expect((await response.json()).fieldErrors.contactEmail).toBe(
      "Did you mean customer@gmail.com?",
    );
  });

  it("turns away test and throwaway email addresses", async () => {
    const fake = await createReturn(json({ ...validReturn(), contactEmail: "a@example.com" }));
    expect(fake.status).toBe(422);
    expect((await fake.json()).fieldErrors.contactEmail).toBe("Please use a real email address");

    const temp = await createReturn(json({ ...validReturn(), contactEmail: "a@mailinator.com" }));
    expect((await temp.json()).fieldErrors.contactEmail).toMatch(/permanent email address/);
  });

  describe("with attachments", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
    const form = (files: { name: string; bytes: Uint8Array; type: string }[]) => {
      const data = new FormData();
      data.append("payload", JSON.stringify(validReturn()));
      for (const f of files)
        data.append("attachments", new File([new Uint8Array(f.bytes)], f.name, { type: f.type }));
      return new Request("http://localhost/api", { method: "POST", body: data });
    };

    it("accepts a label image and records its safe name, never its contents", async () => {
      const response = await createReturn(
        form([{ name: "UPS label.png", bytes: png, type: "image/png" }]),
      );
      expect(response.status).toBe(201);
      const { return: record } = await response.json();
      expect(record.attachments).toEqual([
        { name: "UPS-label.png", type: "image/png", size: png.byteLength },
      ]);
      expect(JSON.stringify(record)).not.toContain("preview");
    });

    it("rejects a file that isn't really an image or PDF", async () => {
      const fake = new TextEncoder().encode("<html>not a label</html>");
      const response = await createReturn(
        form([{ name: "label.png", bytes: fake, type: "image/png" }]),
      );
      expect(response.status).toBe(422);
      expect((await response.json()).fieldErrors.attachments).toMatch(
        /isn't a JPG, PNG, WebP or PDF/,
      );
    });

    it("rejects more than three files", async () => {
      const files = Array.from({ length: 4 }, (_, i) => ({
        name: `${i}.png`,
        bytes: png,
        type: "image/png",
      }));
      const response = await createReturn(form(files));
      expect(response.status).toBe(422);
    });
  });

  it("returns field errors for invalid input", async () => {
    const response = await createReturn(json({ ...validReturn(), itemDescription: "" }));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.fieldErrors.itemDescription).toBeDefined();
  });

  it("rejects pickup dates outside the booking window", async () => {
    const body = validReturn();
    body.pickup.date = toISODate(addDays(new Date(), 60));
    const response = await createReturn(json(body));
    expect(response.status).toBe(422);
  });

  it("rejects malformed JSON", async () => {
    const response = await createReturn(json("{nope"));
    expect(response.status).toBe(400);
  });
});

describe("/api/assistant", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the rule-based engine when no API key is configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await (await engine()).json()).toEqual({ engine: "rules" });

    const response = await analyze(
      json({
        text: "Your Nike return is eligible until December 18. No printer needed, show the UPS QR code.",
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.engine).toBe("rules");
    expect(body.extraction.retailer).toBe("Nike");
    expect(body.summary).toContain("No printer is required");
  });

  it("validates input length", async () => {
    const response = await analyze(json({ text: "too short" }));
    expect(response.status).toBe(422);
  });
});
