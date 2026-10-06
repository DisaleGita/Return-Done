// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDays, toISODate } from "@/lib/dates";

vi.mock("server-only", () => ({}));

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
  contactEmail: "alex@example.com",
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
