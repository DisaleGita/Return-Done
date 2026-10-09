import { describe, expect, it } from "vitest";
import { anonymizeUrl } from "./SiteAnalytics";

describe("anonymizeUrl", () => {
  it("drops query strings, which can hold order numbers and amounts", () => {
    expect(
      anonymizeUrl(
        "https://return-done.vercel.app/schedule?retailer=nike&order=C0123&amount=139.99&attach=1",
      ),
    ).toBe("https://return-done.vercel.app/schedule");
  });

  it("hides tracking numbers in return pages", () => {
    expect(anonymizeUrl("https://return-done.vercel.app/returns/RD-2026-1847")).toBe(
      "https://return-done.vercel.app/returns/[id]",
    );
  });

  it("drops #fragments but keeps ordinary pages as they are", () => {
    expect(anonymizeUrl("https://return-done.vercel.app/#how-it-works")).toBe(
      "https://return-done.vercel.app/",
    );
    expect(anonymizeUrl("https://return-done.vercel.app/about")).toBe(
      "https://return-done.vercel.app/about",
    );
  });
});
